// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');
const axios = require("axios").default;
const translate = require("translate");

admin.initializeApp({
	credential: admin.credential.applicationDefault(),
  	databaseURL: 'ws://futbot-lqmw-default-rtdb.europe-west1.firebasedatabase.app/'
});
 
process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements
 
exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  var db = admin.database();
  var refUsuarios = db.ref("users");
  var refEquipos = db.ref("equipos");
  var apiKey = "ae56fa05eb8fe97b1dcc8b4ee9a39726";
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
        agent.add(`Muy bien ${nickname}. Te has registrado correctamente. ¿Te gustaría iniciar sesión?`);
        agent.setContext({ "name": " IrALogin","lifespan":1});
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
  function handleLoginNombreUsuario(agent) {
    const nickname = agent.parameters.nickname;
    let refUsuario= db.ref(`users/${nickname}`);
    return refUsuario.once('value').then((snapshot) =>{
      var aux =snapshot.exists();
      console.log("AUX: "+aux);
      if(!aux){
        agent.add(`Vaya, parece que ${nickname} no es un nombre de usuario registrado. Por favor, inténtalo de nuevo con otro nombre de usuario válido.`);
        agent.setContext({ "name": "InicioLogin-followup","lifespan":1});
      } else {
        agent.add(`Perfecto, ${nickname}. Introduce ahora tu contraseña.`);
        agent.setContext({ "name": "LoginNombreUsuario-followup","lifespan":1,"parameters":{"nickname": nickname}});

    }
    });
    
  }
  
  function handleLoginPassword(agent) {
    const nickname = agent.parameters.nickname;
    const contraseña = agent.parameters.password;
    return refUsuarios.once('value').then((snapshot) =>{
      var aux = snapshot.child(`${nickname}/contraseña`).val();
      console.log("pass="+aux);
      if(aux != contraseña){
        agent.add(`La contraseña introducida ${contraseña} no es correcta para el usuario ${nickname}. Por favor, inténtalo de nuevo.`);
        agent.setContext({ "name": "LoginNombreUsuario-followup","lifespan":1,"parameters":{"nickname": nickname}});
      } else {
        agent.add(`Perfecto, ${nickname}. Se ha iniciado sesión con éxito.`);
        agent.setFollowupEvent({ "name": "login", "parameters" : { "nickname": nickname}});

    }
    });
    
  }
  
  function handleBuscarEquipo(agent) {
    const nickname = agent.parameters.nickname;
    const equipo = agent.parameters.equipo;
    return refEquipos.once('value').then((snapshot) =>{
      var aux =snapshot.child(`${equipo}`).val();
      console.log(aux);
      if(aux ==null){
        agent.setFollowupEvent({ "name": "APIenBD", "parameters" : { "nickname": nickname, "equipo": equipo}});
        
      } else {
        let nombreEquipo = snapshot.child(`${equipo}`).key;
        let escudo = aux.escudo;
        let ciudad = aux.ciudad;
        let añofundación = aux.añofundación;
        let pais = aux.país;
        let direccion = aux.dirección;
        let estadio = aux.estadio;
        let capacidadestadio = aux.capacidadestadio;
        
        agent.add(new Card({title: `Nombre: ${nombreEquipo}`,imageUrl: escudo,text: `Ciudad: ${ciudad}\nAño de fundación: ${añofundación}\nPaís: ${pais}\nDirección: ${direccion}\nEstadio: ${estadio}\nCapacidad del estadio: ${capacidadestadio}`, buttonText: "Añadir a favoritos",buttonUrl: "Añadir el equipo a favoritos"}));
        
        agent.setContext({ "name": "Home","lifespan":1,"parameters":{"nickname": nickname, "nombreEquipo": nombreEquipo, "escudo":escudo}});

    }
    });
    }
  function handleVerificarSiEquipoExisteEnAPI(agent) {
    const nickname = agent.parameters.nickname;
    const equipo = agent.parameters.equipo;
    var options = {
  		method: 'GET',
  		url: 'https://v3.football.api-sports.io/teams',
  		params: {search: `${equipo}`},
  		headers: {
   		 'x-rapidapi-host': 'v3.football.api-sports.io',
   		 'x-rapidapi-key': apiKey,
  }          
};
       return axios.request(options).then(function (response) {
          	let errors = response.data.results;
            console.log("ERRORS:"+errors);
          	if (errors==0){
              console.log("HAY ERRORES");
              agent.add("Vaya, parece que ese equipo no existe o no soy capaz de encontrarlo. Por favor, asegúrate de que estás escribiendo el nombre correctamente y evita escribir cosas como FC o Balompié. Puedes acudir a la clasificación de su liga para ver su nombre.");
              agent.setContext({ "name": "Home","lifespan":1,"parameters":{"nickname": nickname}});
            }else{
                console.log("NO HAY ERRORES");
            	let respuesta = response.data.response[0];
        		let nombreEquipo = respuesta.team.name;
            	let idAPI = respuesta.team.id;
            	let escudo = respuesta.team.logo;
            	let añofundación = respuesta.team.founded;
  			    let pais=respuesta.team.country;
                let ciudad = respuesta.venue.city;
            	  let direccion = respuesta.venue.address;
            	  let estadio = respuesta.venue.name;
            	  let capacidadestadio = respuesta.venue.capacity;
				  console.log("DATA:" + JSON.stringify(respuesta));
                  agent.setFollowupEvent({ "name": "MostrarEquipoAPI", "parameters" : { "nickname": nickname, "nombreEquipo": nombreEquipo, "idAPI": idAPI, "escudo": escudo, "pais": pais, "ciudad": ciudad, "direccion": direccion, "estadio": estadio, "capacidadestadio": capacidadestadio, "anyofundacion": añofundación}});
              	  
            }
		}).catch(function (error) {
			console.error(error);
});

    }
  
  function handleMostrarEquipoAPI(agent) {
    const nickname = agent.parameters.nickname;
    const nombreEquipo = agent.parameters.nombreEquipo;
    const idAPI = agent.parameters.idAPI;
    const escudo = agent.parameters.escudo;
    const añofundación = agent.parameters.anyofundacion;
    var pais= agent.parameters.pais;
    const ciudad = agent.parameters.ciudad;
    const direccion = agent.parameters.direccion;
    const estadio = agent.parameters.estadio;
    const capacidadestadio = agent.parameters.capacidadestadio;
    return translate(pais, { from: "en", to: "es", engine: "libre" }).then(text => {
		pais=text;
        agent.add(new Card({title: `Nombre: ${nombreEquipo}`,imageUrl: escudo,text: `Ciudad: ${ciudad}\nAño de fundación: ${añofundación}\nPaís: ${pais}\nDirección: ${direccion}\nEstadio: ${estadio}\nCapacidad del estadio: ${capacidadestadio}`, buttonText: "Añadir a favoritos",buttonUrl: "Añadir el equipo a favoritos"}));
        agent.setContext({ "name": "Home","lifespan":1,"parameters":{"nickname": nickname, "nombreEquipo": nombreEquipo, "escudo":escudo}});
        return refEquipos.once('value').then((snapshot) =>{
        if (snapshot.child(`${nombreEquipo}`).exists()){
        console.log("No se añade a BD.");
        } else {
        refEquipos.child(`${nombreEquipo}`).set({
      				escudo : escudo,
        			ciudad : ciudad,
                    idAPI : idAPI,
        			añofundación : añofundación,
        			país : pais,
        			dirección : direccion,
        			estadio : estadio,
        			capacidadestadio : capacidadestadio,
    			});
        }
          });
      	});
    }
  
  function handleEquipoAFavoritos(agent) {
    const nickname = agent.parameters.nickname;
    const equipo = agent.parameters.nombreEquipo;
    const escudo = agent.parameters.escudo;
    let refFavoritos = db.ref(`users/${nickname}/favoritos/equipos`);
    return refEquipos.once('value').then((snapshot) =>{
      var aux =snapshot.child(`${equipo}`).val();
      console.log(aux);
      if(aux ==null){
        agent.add("Solo se pueden añadir a favoritos los equipos que se hayan buscado antes.");
        agent.setContext({ "name": "Home","lifespan":1,"parameters":{"nickname": nickname}});
      } else {
        return refFavoritos.once('value').then((snapshot) =>{
        if (snapshot.child(`${equipo}`).exists()){
        agent.add("Ese equipo ya se encuentra en tu lista de favoritos, prueba a añadir otro.");        
        agent.setContext({ "name": "Home","lifespan":1,"parameters":{"nickname": nickname}});
        }     
         else if(snapshot.numChildren()<5){
        refFavoritos.child(`${equipo}`).set({
      				escudo : escudo
    			});
        
        agent.add("Equipo añadido a favoritos.");        
        agent.setContext({ "name": "Home","lifespan":1,"parameters":{"nickname": nickname}});
        }     
        else{
        agent.add("No se pueden añadir más equipos a la lista de favoritos. Esta puede tener un máximo de 5, si quieres añadir más, prueba a borrar de la lista un equipo que te interese menos.");        
        agent.setContext({ "name": "Home","lifespan":1,"parameters":{"nickname": nickname}});
        }
		});
    }
    });
    }
  
  function handleListarEquiposFavoritos(agent) {
    const nickname = agent.parameters.nickname;
    let refFavoritos = db.ref(`users/${nickname}/favoritos/equipos`);
    return refFavoritos.once('value').then((snapshot) =>{
      console.log(snapshot.exists());
      if (snapshot.exists()){
      return snapshot.forEach((childSnapshot) => {
      
      var aux = childSnapshot.val();
      let nombre = childSnapshot.key;
      let escudo = aux.escudo;
      agent.add(new Card({title: `Nombre: ${nombre}`,imageUrl: escudo,text: "", buttonText: "Ver detalles",buttonUrl: `Quiero información sobre el ${nombre}`}));
      agent.setContext({ "name": "Home","lifespan":1,"parameters":{"nickname": nickname}});
      
    });
    }else{
      agent.add("Vaya, parece que tu lista de favoritos está vacía. Puedes añadir equipos a tu lista de favoritos al buscar información sobre ellos.");
      agent.setContext({ "name": "Home","lifespan":1,"parameters":{"nickname": nickname}});
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
  intentMap.set('LoginNombreUsuario', handleLoginNombreUsuario);
  intentMap.set('LoginPassword', handleLoginPassword);
  intentMap.set('BuscarEquipo', handleBuscarEquipo);
  intentMap.set('VerificarSiEquipoExisteEnAPI', handleVerificarSiEquipoExisteEnAPI);
  intentMap.set('MostrarEquipoAPI', handleMostrarEquipoAPI);
  intentMap.set('EquipoAFavoritos', handleEquipoAFavoritos);
  intentMap.set('ListarEquiposFavoritos', handleListarEquiposFavoritos);
  agent.handleRequest(intentMap);
});
