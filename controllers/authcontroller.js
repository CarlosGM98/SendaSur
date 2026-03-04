const db = require('../models/db');
const bcrypt = require('bcrypt');

// Mostrar Login
exports.showLogin = (req, res) => {
  res.render('login', { error: null });
};

// Iniciar Sesión
exports.login = async (req, res) => {
  const { nombreUsuario, claveUsuario } = req.body;

  try {
    const [results] = await db.execute('SELECT * FROM Usuarios WHERE nombreUsuario = ?', [nombreUsuario]);

    if (results.length === 0 || !(await bcrypt.compare(claveUsuario, results[0].claveUsuario))) {
      return res.render('login', { error: 'Nombre de usuario o clave incorrectos' });
    }

    req.session.usuario = results[0];
    res.redirect('/inicio');
  } catch (err) {
    console.error('❌ Error al iniciar sesión:', err);
    res.status(500).send('Error al iniciar sesión');
  }
};

// Mostrar registro
exports.showRegister = (req, res) => {
  res.render('registro', { error: null, success: null });
};

// Registrar usuario
exports.register = async (req, res) => {
  const { nombreUsuario, claveUsuario, claveConfirmada, correoUsuario } = req.body;

  if (claveUsuario !== claveConfirmada) {
    return res.render('registro', { error: 'Las contraseñas no coinciden.', success: null });
  }

  try {
    const hashedPassword = await bcrypt.hash(claveUsuario, 10);

    const [results] = await db.execute(
      'SELECT * FROM Usuarios WHERE nombreUsuario = ? OR correoUsuario = ?',
      [nombreUsuario, correoUsuario]
    );

    if (results.length > 0) {
      const usuarioExistente = results.find(u => u.nombreUsuario === nombreUsuario);
      const correoExistente = results.find(u => u.correoUsuario === correoUsuario);

      let errorMsg = '';
      if (usuarioExistente) errorMsg = 'El nombre de usuario ya está en uso.';
      else if (correoExistente) errorMsg = 'El correo electrónico ya está en uso.';

      return res.render('registro', { error: errorMsg, success: null });
    }

    await db.execute(
      'INSERT INTO Usuarios (nombreUsuario, claveUsuario, correoUsuario) VALUES (?, ?, ?)',
      [nombreUsuario, hashedPassword, correoUsuario]
    );

    res.render('registro', {
      error: null,
      success: 'Usuario registrado con éxito. Ahora puedes iniciar sesión.'
    });
  } catch (err) {
    console.error('❌ Error al registrar usuario:', err);
    res.status(500).send('Error al registrar usuario');
  }
};

// Página de inicio para usuarios logeados
exports.inicio = (req, res) => {
  if (!req.session.usuario) return res.redirect('/login');
  res.render('inicio', { usuario: req.session.usuario });
};

// Cerrar sesión
exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
};

// Mostrar listado de rutas
exports.listarRutas = async (req, res) => {
  const usuario = req.session.usuario;

  try {
    const [rutas] = await db.execute('SELECT * FROM Rutas');
    res.render('rutas', { rutas, usuario });
  } catch (err) {
    console.error('❌ Error al obtener rutas:', err);
    res.status(500).send('Error al cargar las rutas');
  }
};

// Mostrar formulario de creación de rutas
exports.showCrearRuta = (req, res) => {
  res.render('crearRuta', { usuario: req.session.usuario });
};

// Guardar nueva ruta
exports.crearRuta = async (req, res) => {
  const { nombreRuta, descripcionRuta, localizacionRuta, dificultadRuta, imagenRuta, valoracionRuta } = req.body;
  const idUsuarioFK = req.session.usuario.idUsuario;

  try {
    await db.execute(
      'INSERT INTO Rutas (nombreRuta, descripcionRuta, localizacionRuta, dificultadRuta, imagenRuta, valoracionRuta, idUsuarioFK) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [nombreRuta, descripcionRuta, localizacionRuta, dificultadRuta, imagenRuta, valoracionRuta, idUsuarioFK]
    );
    res.redirect('/rutas');
  } catch (err) {
    console.error('❌ Error al crear ruta:', err);
    res.status(500).send('Error al crear la ruta');
  }
};

// Mostrar rutas creadas por el usuario
exports.misRutas = async (req, res) => {
  try {
    const idUsuario = req.session.usuario.idUsuario;
    const [rutas] = await db.execute('SELECT * FROM Rutas WHERE idUsuarioFK = ?', [idUsuario]);
    res.render('misRutas', { rutas, usuario: req.session.usuario });
  } catch (error) {
    console.error('Error al obtener tus rutas:', error);
    res.status(500).send('Error al cargar tus rutas');
  }
};

// Mostrar detalles de una ruta específica
exports.detalleRuta = async (req, res) => {
  const idRuta = req.params.idRuta;

  try {
    const [rutaRows] = await db.execute('SELECT * FROM Rutas WHERE idRuta = ?', [idRuta]);

    if (rutaRows.length === 0) {
      return res.status(404).send('Ruta no encontrada');
    }

    const [comentariosRows] = await db.execute(`
      SELECT c.contenidoComentario, c.fechaComentario, u.nombreUsuario 
      FROM Comentarios c 
      JOIN Usuarios u ON c.idUsuarioFK = u.idUsuario 
      WHERE c.idRutaFK = ? 
      ORDER BY c.fechaComentario DESC
    `, [idRuta]);

    res.render('detalleRuta', {
      ruta: rutaRows[0],
      comentarios: comentariosRows,
      usuario: req.session.usuario
    });

  } catch (error) {
    console.error('❌ Error al mostrar detalles de la ruta:', error);
    res.status(500).send('Error interno del servidor');
  }
};

// Mostrar formulario de edición
exports.showEditarRuta = async (req, res) => {
  const idRuta = req.params.id;
  try {
    const [result] = await db.execute('SELECT * FROM Rutas WHERE idRuta = ?', [idRuta]);

    if (result.length > 0) {
      res.render('editarRuta', { ruta: result[0] });
    } else {
      res.status(404).send('Ruta no encontrada');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error del servidor');
  }
};

// Guardar cambios de la ruta editada
exports.editarRuta = async (req, res) => {
  const idRuta = req.params.id;
  const { nombreRuta, descripcionRuta, localizacionRuta, dificultadRuta, imagenRuta, valoracionRuta } = req.body;

  try {
    await db.execute(`
      UPDATE Rutas
      SET nombreRuta = ?, descripcionRuta = ?, localizacionRuta = ?, dificultadRuta = ?, imagenRuta = ?, valoracionRuta = ?
      WHERE idRuta = ?
    `, [nombreRuta, descripcionRuta, localizacionRuta, dificultadRuta, imagenRuta, valoracionRuta, idRuta]);

    res.redirect('/mis-rutas');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error actualizando la ruta');
  }
};

// Borrar ruta
exports.borrarRuta = async (req, res) => {
  const idRuta = req.params.id;
  try {
    await db.execute('DELETE FROM Rutas WHERE idRuta = ?', [idRuta]);
    res.redirect('/mis-rutas');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al borrar la ruta');
  }
};

// COMENTARIOS

// Crear comentario
exports.crearComentario = async (req, res) => {
  try {
    const { contenidoComentario, idRuta } = req.body;
    const idUsuario = req.session.usuario.idUsuario;

    if (!contenidoComentario || !idRuta) {
      return res.status(400).send("Faltan datos obligatorios");
    }

    await db.execute(
      `INSERT INTO Comentarios (contenidoComentario, fechaComentario, idUsuarioFK, idRutaFK) 
       VALUES (?, NOW(), ?, ?)`,
      [contenidoComentario, idUsuario, idRuta]
    );

    res.redirect(`/rutas/${idRuta}`);
  } catch (error) {
    console.error("Error al insertar comentario:", error);
    res.status(500).send("Error del servidor");
  }
};

// Mostrar mis comentarios
exports.misComentarios = async (req, res) => {
  const idUsuario = req.session.usuario.idUsuario;

  try {
    const [comentarios] = await db.execute(
      `SELECT c.idComentario, c.contenidoComentario, c.fechaComentario, r.nombreRuta
       FROM Comentarios c
       JOIN Rutas r ON c.idRutaFK = r.idRuta
       WHERE c.idUsuarioFK = ?
       ORDER BY c.fechaComentario DESC`,
      [idUsuario]
    );

    res.render("misComentarios", { comentarios, usuario: req.session.usuario });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al obtener tus comentarios');
  }
};

// Vista para editar los comentarios
exports.editarComentarioVista = async (req, res) => {
  const idComentario = req.params.id;

  try {
    const [result] = await db.execute(
      `SELECT contenidoComentario FROM Comentarios WHERE idComentario = ?`,
      [idComentario]
    );

    if (result.length === 0) return res.status(404).send('Comentario no encontrado');
    res.render('editarComentario', { comentario: result[0], idComentario });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al cargar el comentario');
  }
};

// Guardar la edición del comentario
exports.editarComentario = async (req, res) => {
  const { contenidoComentario } = req.body;
  const idComentario = req.params.id;

  try {
    await db.execute(
      `UPDATE Comentarios SET contenidoComentario = ? WHERE idComentario = ?`,
      [contenidoComentario, idComentario]
    );
    res.redirect('/mis-comentarios');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al editar comentario');
  }
};

// Eliminar comentario
exports.eliminarComentario = async (req, res) => {
  const idComentario = req.params.id;

  try {
    await db.execute(
      `DELETE FROM Comentarios WHERE idComentario = ?`,
      [idComentario]
    );
    res.redirect('/mis-comentarios');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al eliminar comentario');
  }
};
