// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');

admin.initializeApp({
	credential: admin.credential.applicationDefault(),
  	databaseURL: 'ws://futbot-lqmw-default-rtdb.europe-west1.firebasedatabase.app/'
});
 
process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements
 
exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  var db = admin.database();
  var refUsuarios = db.ref("users");
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
 
  function welcome(agent) {
    agent.add(`Welcome to my agent!`);
  }
 
  function fallback(agent) {
    agent.add(`I didn't understand`);
    agent.add(`I'm sorry, can you try again?`);
  }
  
  function handleGuardarEnDB(agent) {
    const texto = agent.parameters.texto;
    agent.add(`Gracias...`);

    return admin.database().ref('datos').child('textoNuevo').push().set({
      texto: texto
    });
  }
  
  function handleLeerDeDB(agent) {
      return admin.database().ref('datos').once('value').then((snapshot) => {
        const value = snapshot.child('texto').val();
        if(value != null){
          agent.add(`El valor de texto de la base de datos es ${value}`);
        }
      });
  }
  
  function handleBorrarDeBD(agent) {
    return admin.database().ref('datos').child('textoNuevo').remove();
  }
  
  function handleRegistrarPassword(agent) {
    const nombre = agent.parameters.nombre;
    const apellidos = agent.parameters.apellidos;
    const email = agent.parameters.email;
    const nickname = agent.parameters.nickname;
    const contraseña = agent.parameters.password;
	if (contraseña.length < 6) {
        agent.add(`Lo siento, esa contraseña es demasiado corta, debe tener mínimo 6 caracteres.`);
      	agent.setContext({ "name": "RegistrarNickname-followup","lifespan":1,"parameters":{"nombre":nombre, "apellidos":apellidos, "email":email, "nickname":nickname}});
    } else if (contraseña.length > 20) {
        agent.add(`Lo siento, esa contraseña es demasiado larga, debe tener máximo 20 caracteres.`);
      	agent.setContext({ "name": "RegistrarNickname-followup","lifespan":1,"parameters":{"nombre":nombre, "apellidos":apellidos, "email":email, "nickname":nickname}});
    } else if (contraseña.search(/\d/) == -1) {
        agent.add(`La contraseña debe tener al menos 1 número. Inténtalo de nuevo por favor.`);
      	agent.setContext({ "name": "RegistrarNickname-followup","lifespan":1,"parameters":{"nombre":nombre, "apellidos":apellidos, "email":email, "nickname":nickname}});
    } else if (contraseña.search(/[a-z]/) == -1) {
        agent.add(`La contraseña debe tener al menos 1 letra minúscula. Inténtalo de nuevo por favor.`);
      	agent.setContext({ "name": "RegistrarNickname-followup","lifespan":1,"parameters":{"nombre":nombre, "apellidos":apellidos, "email":email, "nickname":nickname}});
    } else if (contraseña.search(/[A-Z]/) == -1) {
        agent.add(`La contraseña debe tener al menos 1 letra mayúscula. Inténtalo de nuevo por favor.`);
      	agent.setContext({ "name": "RegistrarNickname-followup","lifespan":1,"parameters":{"nombre":nombre, "apellidos":apellidos, "email":email, "nickname":nickname}});
    } else {
      return refUsuarios.child(nickname).set({
      nombre: nombre,
      apellidos: apellidos,
      email: email,
      contraseña: contraseña
    });
    }
  }
  
  function handleRegistrarNickname(agent) {
    const nombre = agent.parameters.nombre;
    const apellidos = agent.parameters.apellidos;
    const email = agent.parameters.email;
    const nickname = agent.parameters.nickname;
    let regex = /[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/;
    return refUsuarios.once('value').then((snapshot) =>{
      var aux =snapshot.child(`${nickname}`).val();
      if(aux !=null){
        agent.add(`Vaya, parece que ${nickname} ya está registrado. Por favor, inténtalo de nuevo con otro nombre de usuario válido.`);
        agent.setContext({ "name": "RegistrarEmail-followup","lifespan":1,"parameters":{"nombre":nombre, "apellidos":apellidos, "email":email}});
      }else if (nickname.length < 4) {
        agent.add(`Lo siento, ese nombre de usuario es demasiado corto, debe tener mínimo 4 caracteres.`);
      	agent.setContext({ "name": " RegistrarEmail-followup","lifespan":1,"parameters":{"nombre":nombre, "apellidos":apellidos, "email":email}});
   	  } else if (nickname.length > 12) {
        agent.add(`Lo siento, ese nombre de usuario es demasiado largo, debe tener máximo 12 caracteres.`);
      	agent.setContext({ "name": "RegistrarEmail-followup","lifespan":1,"parameters":{"nombre":nombre, "apellidos":apellidos, "email":email}});
      } else if (regex.test(nickname)) {
        agent.add(`El nombre de usuario solo puede contener letras y, opcionalmente, números. Inténtalo de nuevo, por favor.`);
      	agent.setContext({ "name": "RegistrarEmail-followup","lifespan":1,"parameters":{"nombre":nombre, "apellidos":apellidos, "email":email}});
      } else if (nickname.search(/[a-zA-Z]{4,}/g) == -1) {
        agent.add(`El nombre de usuario debe contener al menos 4 letras. Por favor, introdúcelo de nuevo.`);
      	agent.setContext({ "name": "RegistrarEmail-followup","lifespan":1,"parameters":{"nombre":nombre, "apellidos":apellidos, "email":email}});
      } else {
        agent.add(`Muy bien ${nickname}. Por último, necesito que introduzcas una contraseña que contenga como mínimo mayúsculas, minúsculas y números.`);
        agent.setContext({ "name": "RegistrarNickname-followup","lifespan":1,"parameters":{"nombre":nombre, "apellidos":apellidos, "email":email, "nickname": nickname}});

    }
    });
    
  }

  let intentMap = new Map();
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Default Fallback Intent', fallback);
  intentMap.set('guardarEnDB', handleGuardarEnDB);
  intentMap.set('leerDeDB', handleLeerDeDB);
  intentMap.set('borrarDeDB', handleBorrarDeBD);
  intentMap.set('RegistrarNickname', handleRegistrarNickname);
  intentMap.set('RegistrarPassword', handleRegistrarPassword);
  agent.handleRequest(intentMap);
});
