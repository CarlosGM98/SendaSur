const express = require('express');
const router = express.Router();
const authController = require('../controllers/authcontroller'); // Controlador de autenticación y rutas

// Middleware para verificar sesión
function verificarLogin(req, res, next) {
  if (!req.session.usuario) {
    return res.redirect('/login');
  }
  next();
}

// Rutas de autenticación
router.get('/', (req, res) => res.redirect('/login'));
router.get('/login', authController.showLogin);
router.post('/login', authController.login);
router.get('/registro', authController.showRegister);
router.post('/registro', authController.register);
router.get('/inicio', authController.inicio);
router.get('/logout', authController.logout);

// Ruta para listar rutas de senderismo
router.get('/rutas', verificarLogin, authController.listarRutas);

// Mostrar formulario de creación de rutas
router.get('/crear-ruta', verificarLogin, authController.showCrearRuta);

// Ruta para mostrar detalles de una ruta específica
router.get('/rutas/:idRuta', verificarLogin, authController.detalleRuta);

// Crear ruta
router.post('/crear-ruta', authController.crearRuta);

// Ver rutas de la persona logeada
router.get('/mis-rutas', verificarLogin, authController.misRutas);

// Mostrar formulario de edición
router.get('/rutas/editar/:id', authController.showEditarRuta);

// Guardar cambios de la ruta editada
router.post('/rutas/editar/:id', authController.editarRuta);

// Borrar rutas
router.post('/rutas/borrar/:id', authController.borrarRuta);

// Comentarios
router.post('/comentarios/crear', authController.crearComentario);

//Mostrar comentarios, editarlos y borrarlos
router.get('/mis-comentarios', verificarLogin, authController.misComentarios);
router.get('/comentarios/editar/:id', verificarLogin, authController.editarComentarioVista);
router.post('/comentarios/editar/:id', verificarLogin, authController.editarComentario);
router.post('/comentarios/eliminar/:id', verificarLogin, authController.eliminarComentario);



module.exports = router;
