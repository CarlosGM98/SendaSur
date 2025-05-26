const express = require('express');  //Framework principal
const session = require('express-session');  //Para manejar sesiones de usuarios(Guardar datos)
const bodyParser = require('body-parser'); //Para acceder facil a datos de forms HTML
const path = require('path'); //Para construir rutas de carpetas
const authRoutes = require('./routes/auth'); //Importar rutas de autentificación

const app = express();  //Creo la instancia de la aplicación Express
app.set('view engine', 'ejs');  //Para usar js como motor de plantillas
app.set('views', path.join(__dirname, 'views'));  //Las vistas ejs estan en la carpeta views
app.use(express.static(path.join(__dirname, 'public')));  //Sirve archivos como imágenes desde /public
app.use(bodyParser.urlencoded({ extended: false }));  //Configuro bodyParser para que puedas recibir datos de formularios (POST) en req.body
app.use(session({
  secret: 'sendaSurSecret',
  resave: false,
  saveUninitialized: true
}));  

app.use('/', authRoutes);  //Importo las rutas que definí en auth.js, para que gestionen todo lo relacionado con login, logout, registro, etc.

app.use(express.static('public'));


//Para poner en marcha el servidor en el puerto 3000
app.listen(3000, () => {
  console.log('Servidor en http://localhost:3000');
});
