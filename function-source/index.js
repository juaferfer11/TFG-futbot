// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { WebhookClient } = require('dialogflow-fulfillment');
const { Card, Suggestion, Payload } = require('dialogflow-fulfillment');
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
  var refCompeticiones = db.ref("competiciones");
  var refJugadores = db.ref("jugadores");
  var refJornadas = db.ref("jornadas");
  var apiKey = "";
  var translateKey = "";
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));


  //REGISTRO DE USUARIOS
  //=========================================================================================================================================================================
  function handleRegistrarPassword(agent) {
    const nombre = agent.parameters.nombre;
    const apellidos = agent.parameters.apellidos;
    const email = agent.parameters.email;
    const nickname = agent.parameters.nickname;
    const contraseña = agent.parameters.password;
    if (contraseña.length < 6) {
      agent.add(`Lo siento, esa contraseña es demasiado corta, debe tener mínimo 6 caracteres.`);
      agent.setContext({ "name": "RegistrarNickname-followup", "lifespan": 1, "parameters": { "nombre": nombre, "apellidos": apellidos, "email": email, "nickname": nickname } });
    } else if (contraseña.length > 20) {
      agent.add(`Lo siento, esa contraseña es demasiado larga, debe tener máximo 20 caracteres.`);
      agent.setContext({ "name": "RegistrarNickname-followup", "lifespan": 1, "parameters": { "nombre": nombre, "apellidos": apellidos, "email": email, "nickname": nickname } });
    } else if (contraseña.search(/\d/) == -1) {
      agent.add(`La contraseña debe tener al menos 1 número. Inténtalo de nuevo por favor.`);
      agent.setContext({ "name": "RegistrarNickname-followup", "lifespan": 1, "parameters": { "nombre": nombre, "apellidos": apellidos, "email": email, "nickname": nickname } });
    } else if (contraseña.search(/[a-z]/) == -1) {
      agent.add(`La contraseña debe tener al menos 1 letra minúscula. Inténtalo de nuevo por favor.`);
      agent.setContext({ "name": "RegistrarNickname-followup", "lifespan": 1, "parameters": { "nombre": nombre, "apellidos": apellidos, "email": email, "nickname": nickname } });
    } else if (contraseña.search(/[A-Z]/) == -1) {
      agent.add(`La contraseña debe tener al menos 1 letra mayúscula. Inténtalo de nuevo por favor.`);
      agent.setContext({ "name": "RegistrarNickname-followup", "lifespan": 1, "parameters": { "nombre": nombre, "apellidos": apellidos, "email": email, "nickname": nickname } });
    } else {
      agent.add(`Muy bien ${nickname}. Te has registrado correctamente. ¿Te gustaría iniciar sesión?`);
      agent.setContext({ "name": " IrALogin", "lifespan": 1 });
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
    return refUsuarios.once('value').then((snapshot) => {
      var aux = snapshot.child(`${nickname}`).val();
      if (aux != null) {
        agent.add(`Vaya, parece que ${nickname} ya está registrado. Por favor, inténtalo de nuevo con otro nombre de usuario válido.`);
        agent.setContext({ "name": "RegistrarEmail-followup", "lifespan": 1, "parameters": { "nombre": nombre, "apellidos": apellidos, "email": email } });
      } else if (nickname.length < 4) {
        agent.add(`Lo siento, ese nombre de usuario es demasiado corto, debe tener mínimo 4 caracteres.`);
        agent.setContext({ "name": " RegistrarEmail-followup", "lifespan": 1, "parameters": { "nombre": nombre, "apellidos": apellidos, "email": email } });
      } else if (nickname.length > 12) {
        agent.add(`Lo siento, ese nombre de usuario es demasiado largo, debe tener máximo 12 caracteres.`);
        agent.setContext({ "name": "RegistrarEmail-followup", "lifespan": 1, "parameters": { "nombre": nombre, "apellidos": apellidos, "email": email } });
      } else if (regex.test(nickname)) {
        agent.add(`El nombre de usuario solo puede contener letras y, opcionalmente, números. Inténtalo de nuevo, por favor.`);
        agent.setContext({ "name": "RegistrarEmail-followup", "lifespan": 1, "parameters": { "nombre": nombre, "apellidos": apellidos, "email": email } });
      } else if (nickname.search(/[a-zA-Z]{4,}/g) == -1) {
        agent.add(`El nombre de usuario debe contener al menos 4 letras. Por favor, introdúcelo de nuevo.`);
        agent.setContext({ "name": "RegistrarEmail-followup", "lifespan": 1, "parameters": { "nombre": nombre, "apellidos": apellidos, "email": email } });
      } else {
        agent.add(`Muy bien ${nickname}. Por último, necesito que introduzcas una contraseña que contenga como mínimo mayúsculas, minúsculas y números.`);
        agent.setContext({ "name": "RegistrarNickname-followup", "lifespan": 1, "parameters": { "nombre": nombre, "apellidos": apellidos, "email": email, "nickname": nickname } });

      }
    });

  }

  function handleSiRegistroCancelar(agent) {
    agent.setFollowupEvent({ "name": "Welcome", "lifespan": 1 });
  }

  function handleRegistrarNombreCancelar(agent) {
    agent.setFollowupEvent({ "name": "Welcome", "lifespan": 1 });
  }

  function handleRegistrarApellidosCancelar(agent) {
    agent.setFollowupEvent({ "name": "Welcome", "lifespan": 1 });
  }

  function handleRegistrarEmailCancelar(agent) {
    agent.setFollowupEvent({ "name": "Welcome", "lifespan": 1 });
  }
  function handleRegistrarPasswordCancelar(agent) {
    agent.setFollowupEvent({ "name": "Welcome", "lifespan": 1 });
  }
  //=========================================================================================================================================================================
  //LOGIN DE USUARIOS
  //=========================================================================================================================================================================
  function handleLoginNombreUsuario(agent) {
    const nickname = agent.parameters.nickname;
    let refUsuario = db.ref(`users/${nickname}`);
    return refUsuario.once('value').then((snapshot) => {
      var aux = snapshot.exists();
      console.log("AUX: " + aux);
      if (nickname === "Cancelar" || nickname === "Salir") {
        agent.setFollowupEvent({ "name": "Welcome", "lifespan": 1 });
      } else if (!aux) {
        agent.add(`Vaya, parece que ${nickname} no es un nombre de usuario registrado. Por favor, inténtalo de nuevo con otro nombre de usuario válido.`);
        agent.setContext({ "name": "InicioLogin-followup", "lifespan": 1 });
      }
      else {
        agent.add(`Perfecto, ${nickname}. Introduce ahora tu contraseña.`);
        agent.setContext({ "name": "LoginNombreUsuario-followup", "lifespan": 1, "parameters": { "nickname": nickname } });

      }
    });

  }

  function handleLoginPassword(agent) {
    const nickname = agent.parameters.nickname;
    const contraseña = agent.parameters.password;
    return refUsuarios.once('value').then((snapshot) => {
      var aux = snapshot.child(`${nickname}/contraseña`).val();
      console.log("pass=" + aux);
      if (contraseña === "Cancelar" || contraseña === "Salir") {
        agent.setFollowupEvent({ "name": "Welcome", "lifespan": 1 });
      } else if (aux != contraseña) {
        agent.add(`La contraseña introducida no es correcta para el usuario ${nickname}. Por favor, inténtalo de nuevo.`);
        agent.setContext({ "name": "LoginNombreUsuario-followup", "lifespan": 1, "parameters": { "nickname": nickname } });
      } else {
        agent.add(`Perfecto, ${nickname}. Se ha iniciado sesión con éxito.`);
        agent.setFollowupEvent({ "name": "login", "parameters": { "nickname": nickname } });

      }
    });

  }
  //=========================================================================================================================================================================
  //BÚSQUEDA DE EQUIPOS
  //=========================================================================================================================================================================
  function handleBuscarEquipo(agent) {
    const nickname = agent.parameters.nickname;
    const equipo = agent.parameters.equipo;
    return refEquipos.once('value').then((snapshot) => {
      var aux = snapshot.child(`${equipo}`).val();
      console.log(aux);
      if (aux == null) {
        agent.setFollowupEvent({ "name": "APIenBD", "parameters": { "nickname": nickname, "equipo": equipo } });

      } else {
        let nombreEquipo = snapshot.child(`${equipo}`).key;
        let escudo = aux.escudo;
        let ciudad = aux.ciudad;
        let añofundación = aux.añofundación;
        let pais = aux.país;
        let direccion = aux.dirección;
        let estadio = aux.estadio;
        let capacidadestadio = aux.capacidadestadio;
		let refFavoritos = db.ref(`users/${nickname}/favoritos/equipos`);
    	return refFavoritos.once('value').then((snapshot) => {
        if (snapshot.exists()) {
          agent.add(new Card({ title: `Nombre: ${nombreEquipo}`, imageUrl: escudo, text: `Ciudad: ${ciudad}\nAño de fundación: ${añofundación}\nPaís: ${pais}\nDirección: ${direccion}\nEstadio: ${estadio}\nCapacidad del estadio: ${capacidadestadio}`, buttonText: "Añadir a favoritos", buttonUrl: "Añadir el equipo a favoritos" }));
        }else{
          agent.add(new Card({ title: `Nombre: ${nombreEquipo}`, imageUrl: escudo, text: `Ciudad: ${ciudad}\nAño de fundación: ${añofundación}\nPaís: ${pais}\nDirección: ${direccion}\nEstadio: ${estadio}\nCapacidad del estadio: ${capacidadestadio}`, buttonText: "Quitar de favoritos", buttonUrl: `Quiero eliminar el ${nombreEquipo} de mi lista de equipos favoritos` }));
        }
        agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname, "nombreEquipo": nombreEquipo, "escudo": escudo } });
		});
      }
    });
  }
  function handleVerificarSiEquipoExisteEnAPI(agent) {
    const nickname = agent.parameters.nickname;
    const equipo = agent.parameters.equipo;
    var options = {
      method: 'GET',
      url: 'https://v3.football.api-sports.io/teams',
      params: { search: `${equipo}` },
      headers: {
        'x-rapidapi-host': 'v3.football.api-sports.io',
        'x-rapidapi-key': apiKey,
      }
    };
    return axios.request(options).then(function (response) {
      let results = response.data.results;
      console.log("RESULTADOS:" + results);
      if (results == 0) {
        console.log("HAY ERRORES");
        agent.add("Vaya, parece que ese equipo no existe o no soy capaz de encontrarlo. Por favor, asegúrate de que estás escribiendo el nombre correctamente y evita escribir cosas como FC o Balompié. Puedes acudir a la clasificación de su liga para ver su nombre.");
        agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
      } else {
        console.log("NO HAY ERRORES");
        let respuesta = response.data.response[0];
        let nombreEquipo = respuesta.team.name;
        let idAPI = respuesta.team.id;
        let escudo = respuesta.team.logo;
        let añofundación = respuesta.team.founded;
        let pais = respuesta.team.country;
        let ciudad = respuesta.venue.city;
        let direccion = respuesta.venue.address;
        let estadio = respuesta.venue.name;
        let capacidadestadio = respuesta.venue.capacity;
        console.log("DATA:" + JSON.stringify(respuesta));
        agent.setFollowupEvent({ "name": "MostrarEquipoAPI", "parameters": { "nickname": nickname, "nombreEquipo": nombreEquipo, "idAPI": idAPI, "escudo": escudo, "pais": pais, "ciudad": ciudad, "direccion": direccion, "estadio": estadio, "capacidadestadio": capacidadestadio, "anyofundacion": añofundación } });

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
    var pais = agent.parameters.pais;
    const ciudad = agent.parameters.ciudad;
    const direccion = agent.parameters.direccion;
    const estadio = agent.parameters.estadio;
    const capacidadestadio = agent.parameters.capacidadestadio;
    return translate(pais, { from: "en", to: "es", engine: "google", key: translateKey }).then(text => {
      pais = text;
      agent.add(new Card({ title: `Nombre: ${nombreEquipo}`, imageUrl: escudo, text: `Ciudad: ${ciudad}\nAño de fundación: ${añofundación}\nPaís: ${pais}\nDirección: ${direccion}\nEstadio: ${estadio}\nCapacidad del estadio: ${capacidadestadio}`, buttonText: "Añadir a favoritos", buttonUrl: "Añadir el equipo a favoritos" }));
      agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname, "nombreEquipo": nombreEquipo, "escudo": escudo } });
      return refEquipos.once('value').then((snapshot) => {
        if (snapshot.child(`${nombreEquipo}`).exists()) {
          console.log("No se añade a BD.");
        } else {
          refEquipos.child(`${nombreEquipo}`).set({
            escudo: escudo,
            ciudad: ciudad,
            idAPI: idAPI,
            añofundación: añofundación,
            país: pais,
            dirección: direccion,
            estadio: estadio,
            capacidadestadio: capacidadestadio,
          });
        }
      });
    });
  }
  //=========================================================================================================================================================================
  //LISTA DE EQUIPOS FAVORITOS
  //=========================================================================================================================================================================
  function handleEquipoAFavoritos(agent) {
    const nickname = agent.parameters.nickname;
    const equipo = agent.parameters.nombreEquipo;
    const escudo = agent.parameters.escudo;
    let refFavoritos = db.ref(`users/${nickname}/favoritos/equipos`);
    return refEquipos.once('value').then((snapshot) => {
      var aux = snapshot.child(`${equipo}`).val();
      console.log(aux);
      if (aux == null) {
        agent.add("Solo se pueden añadir a favoritos los equipos que se hayan buscado antes.");
        agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
      } else {
        return refFavoritos.once('value').then((snapshot) => {
          if (snapshot.child(`${equipo}`).exists()) {
            agent.add("Ese equipo ya se encuentra en tu lista de favoritos, prueba a añadir otro.");
            agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
          }
          else if (snapshot.numChildren() < 5) {
            refFavoritos.child(`${equipo}`).set({
              escudo: escudo,
              idEquipo: aux.idAPI,
              
            });

            agent.add("Equipo añadido a favoritos.");
            agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
          }
          else {
            agent.add("No se pueden añadir más equipos a la lista de favoritos. Esta puede tener un máximo de 5, si quieres añadir más, prueba a borrar de la lista un equipo que te interese menos.");
            agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
          }
        });
      }
    });
  }

  function handleEliminarEquipoFavoritos(agent) {
    const nickname = agent.parameters.nickname;
    const equipo = agent.parameters.nombreEquipo;
    let refFavoritos = db.ref(`users/${nickname}/favoritos/equipos`);
    let refNotificaciones = db.ref(`users/${nickname}/notificaciones`);
    return refEquipos.once('value').then((snapshot) => {
      var aux = snapshot.child(`${equipo}`).val();
      console.log(aux);
      if (aux == null) {
        agent.add("No se puede eliminar un equipo de la lista de favoritos si no se ha buscado antes.");
        agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
      } else {
        return refFavoritos.once('value').then((snapshot) => {
          if (snapshot.child(`${equipo}`).exists()) {
            let refFavorito = db.ref(`users/${nickname}/favoritos/equipos/${equipo}`);
            agent.add("El equipo se ha eliminado correctamente de tu lista de favoritos.");
            agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
            return refNotificaciones.once('value').then((snapshot) => {
      		if(snapshot.exists()){
              let notificaciones = snapshot.val();
              if(notificaciones.nombreEquipo === equipo){
                refNotificaciones.remove();
              }
			}
            return refFavorito.remove();
            
            });
          } else {
            agent.add("No se puede eliminar un equipo de la lista de favoritos si este no se encuentra en la misma.");
            agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
          }
        });
      }
    });
  }
  function handleBuscarProximaJornadaEquipoFavorito(agent) {
    console.log("PROXIMA JORNADA EQUIPO FAVORITO");
    const nickname = agent.parameters.nickname;
    const nombreEquipo = agent.parameters.nombreEquipo;
    let refFavoritos = db.ref(`users/${nickname}/favoritos/equipos`);
    if (nombreEquipo == ""){
      agent.add("Vaya, parece que ese equipo no existe o no soy capaz de encontrarlo. Por favor, asegúrate de que estás escribiendo el nombre correctamente y evita escribir cosas como FC o Balompié. Puedes acudir a la clasificación de su liga para ver su nombre.");
      agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
    }else{
      return refFavoritos.child(nombreEquipo).once('value').then((snapshot) => {
        if(!snapshot.exists()){
          agent.add("Vaya, parece que ese equipo no existe o no soy capaz de encontrarlo. Por favor, asegúrate de que estás escribiendo el nombre correctamente y evita escribir cosas como FC o Balompié. Puedes acudir a la clasificación de su liga para ver su nombre.");
          agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
        }else{
          let idEquipo = snapshot.val().idEquipo;
          let nombreLiga = snapshot.val().nombreLiga;
        if(nombreLiga != null){
          agent.setContext({ "name": "Home", "lifespan": 1});
          agent.setFollowupEvent({ "name": "BuscarProximaJornada", "parameters": {"nickname": nickname,"equipo": nombreEquipo, "competicion": nombreLiga } });
        }else{
          var options = {
            method: 'GET',
            url: 'https://v3.football.api-sports.io/leagues',
            params: { season: 2020, team: idEquipo, type: "League" },
            headers: {
              'x-rapidapi-host': 'v3.football.api-sports.io',
              'x-rapidapi-key': apiKey,
            }
          };
          return axios.request(options).then(function (response) {
            let errors = response.data.results;
            console.log("ERRORS:" + errors);
            if (errors == 0) {
              console.log("HAY ERRORES");
              agent.add("Vaya, parece que ese equipo no existe o no soy capaz de encontrarlo. Por favor, asegúrate de que estás escribiendo el nombre correctamente y evita escribir cosas como FC o Balompié. Puedes acudir a la clasificación de su liga para ver su nombre.");
              agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
            } else {
              console.log("NO HAY ERRORES");
              let respuesta = response.data.response[0];
              nombreLiga = respuesta.league.name;
              agent.setContext({ "name": "Home", "lifespan": 1});
              agent.setFollowupEvent({ "name": "BuscarProximaJornada", "parameters": {"nickname": nickname,"equipo": nombreEquipo, "competicion": nombreLiga } });
              refFavoritos.child(nombreEquipo).update({
                nombreLiga: nombreLiga
                });
            }
          });
              }
        }
        });
    }
  }
  
  function handleBuscarUltimaJornadaEquipoFavorito(agent) {
    console.log("ULTIMA JORNADA EQUIPO FAVORITO");
    const nickname = agent.parameters.nickname;
    const nombreEquipo = agent.parameters.nombreEquipo;
    let refFavoritos = db.ref(`users/${nickname}/favoritos/equipos`);
    if (nombreEquipo == ""){
      agent.add("Vaya, parece que ese equipo no existe o no soy capaz de encontrarlo. Por favor, asegúrate de que estás escribiendo el nombre correctamente y evita escribir cosas como FC o Balompié. Puedes acudir a la clasificación de su liga para ver su nombre.");
      agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
    }else{
      return refFavoritos.child(nombreEquipo).once('value').then((snapshot) => {
        if(!snapshot.exists()){
          agent.add("Vaya, parece que ese equipo no existe o no soy capaz de encontrarlo. Por favor, asegúrate de que estás escribiendo el nombre correctamente y evita escribir cosas como FC o Balompié. Puedes acudir a la clasificación de su liga para ver su nombre.");
          agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
        }else{
          let idEquipo = snapshot.val().idEquipo;
        let nombreLiga = snapshot.val().nombreLiga;
        if(nombreLiga != null){
          agent.setContext({ "name": "Home", "lifespan": 1});
          agent.setFollowupEvent({ "name": "BuscarUltimaJornada", "parameters": {"nickname": nickname,"equipo": nombreEquipo, "competicion": nombreLiga } });
        }else{
          var options = {
            method: 'GET',
            url: 'https://v3.football.api-sports.io/leagues',
            params: { season: 2020, team: idEquipo, type: "League" },
            headers: {
              'x-rapidapi-host': 'v3.football.api-sports.io',
              'x-rapidapi-key': apiKey,
            }
          };
          return axios.request(options).then(function (response) {
            let errors = response.data.results;
            console.log("ERRORS:" + errors);
            if (errors == 0) {
              console.log("HAY ERRORES");
              agent.add("Vaya, parece que ese equipo no existe o no soy capaz de encontrarlo. Por favor, asegúrate de que estás escribiendo el nombre correctamente y evita escribir cosas como FC o Balompié. Puedes acudir a la clasificación de su liga para ver su nombre.");
              agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
            } else {
              console.log("NO HAY ERRORES");
              let respuesta = response.data.response[0];
              nombreLiga = respuesta.league.name;
              agent.setContext({ "name": "Home", "lifespan": 1});
              agent.setFollowupEvent({ "name": "BuscarUltimaJornada", "parameters": {"nickname": nickname,"equipo": nombreEquipo, "competicion": nombreLiga } });
              refFavoritos.child(nombreEquipo).update({
                nombreLiga: nombreLiga
                });
            }
          });
              }
        }
        });
    }
  }
  
  function handleListarEquiposFavoritos(agent) {
    const nickname = agent.parameters.nickname;
    let refFavoritos = db.ref(`users/${nickname}/favoritos/equipos`);
    let refNotificaciones = db.ref(`users/${nickname}/notificaciones`);
    return refNotificaciones.once('value').then((snapshot) => {
    let tieneNotificaciones = null;
    if (snapshot.exists()) {
      tieneNotificaciones = snapshot.val().nombreEquipo;
    }
    return refFavoritos.once('value').then((snapshot) => {
      console.log(snapshot.exists());
      if (snapshot.exists()) {
        return snapshot.forEach((childSnapshot) => {
          var aux = childSnapshot.val();
          let nombre = childSnapshot.key;
          let escudo = aux.escudo;
          let idEquipo = aux.idEquipo;
          agent.add(new Card({ title: `Nombre: ${nombre}`, imageUrl: escudo, text: "", buttonText: "Ver detalles", buttonUrl: `Quiero información sobre el ${nombre}` }));
          agent.add(new Card({ title: `Nombre: ${nombre}`, text: "", buttonText: "Quitar de favoritos", buttonUrl: `Eliminar ${nombre} de lista` }));
          if(tieneNotificaciones == null){
            agent.add(new Card({ title: `Nombre: ${nombre}`, text: "Parece que no tienes ningún equipo configurado para recibir notificaciones, si quieres recibir notificaciones de este equipo pulsa el siguiente botón.", buttonText: "Activar notificaciones", buttonUrl: `Activar notificaciones ${nombre}` }));
          }else if(tieneNotificaciones != nombre){
            agent.add(new Card({ title: `Nombre: ${nombre}`, text: `Puedes activar las notificaciones para este equipo, pero eso significaría desactivarlas para el equipo que tienes actualmente configurado, cuyo nombre es ${tieneNotificaciones}`, buttonText: "Activar notificaciones", buttonUrl: `Activar notificaciones ${nombre}` }));
          }
          else{
            agent.add(new Card({ title: `Nombre: ${nombre}`, text: "Si no quieres recibir más notificaciones de este equipo, pulsa el siguiente botón.", buttonText: "Desactivar notificaciones", buttonUrl: `Desactivar notificaciones ${nombre}` }));
          }
          agent.add(new Card({ title: `Nombre: ${nombre}`, text: "", buttonText: "Ver estadísticas en liga", buttonUrl: `Buscar estadísticas en liga del equipo ${nombre}` }));
          agent.add(new Card({ title: `Nombre: ${nombre}`, text: "", buttonText: "Ver próxima jornada", buttonUrl: `Buscar próxima jornada del equipo ${nombre}` }));
          agent.add(new Card({ title: `Nombre: ${nombre}`, text: "", buttonText: "Ver última jornada", buttonUrl: `Buscar última jornada del equipo ${nombre}` }));
          
          agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname} });

        });
      } else {
        agent.add("Vaya, parece que tu lista de favoritos está vacía. Puedes añadir equipos a tu lista de favoritos al buscar información sobre ellos.");
        agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
      }
    });
    });
    
  }
  //=========================================================================================================================================================================
  //BÚSQUEDA DE COMPETICIONES
  //=========================================================================================================================================================================
  function handleBuscarCompeticionNombreYPais(agent) {
    const nickname = agent.parameters.nickname;
    console.log("BUSCAR CON PAÍS");
    var competicion = agent.parameters.competicion;
    var competicionAux = [competicion];
    if (/\s/.test(competicion)) {
      competicionAux = competicion.split(" ");
    }
    for (var i = 0; i < competicionAux.length; i++) {
      competicionAux[i] = competicionAux[i].charAt(0).toUpperCase() + competicionAux[i].substring(1);
    }
    competicion = competicionAux.join(' ');
    console.log("COMPETICIÓN: " + competicion);
    var location = agent.parameters.location.country;
    var locationAux = [location];
    if (/\s/.test(location)) {
      locationAux = location.split(" ");
    }
    for (var j = 0; j < locationAux.length; j++) {
      locationAux[j] = locationAux[j].charAt(0).toUpperCase() + locationAux[j].substring(1);
    }
    location = locationAux.join(' ');
    console.log(location);
    return refCompeticiones.child(competicion).once('value').then((snapshot) => {
      var aux = snapshot.val();
      console.log(aux);
      if (aux == null||aux.país != location) {
        agent.add("No he podido encontrar ninguna competición para ese país. Por favor, ten en cuenta que yo me especializo en las grandes ligas europeas, por lo que ahora mismo no soy capaz de proporcionar este servicio para ligas de otros países, o a ligas menores de dichos países. Para más información, escribe 'Ayuda'");

        agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
      } else {
          let datos = aux;
          let nombre = snapshot.key;
          console.log("KEY:"+nombre);
          let logo = datos.logo;
          let fechacomienzo = datos.fechacomienzo;
          let fechafin = datos.fechafin;
          let pais = datos.país;
          let tipo = datos.tipo;
          let refFavoritos = db.ref(`users/${nickname}/favoritos/competiciones`);
		  return refFavoritos.once('value').then((snapshot) => {
          if (snapshot.child(`${nombre}`).exists()) {
            agent.add(new Card({ title: `Nombre: ${nombre}`, imageUrl: logo, text: `País: ${pais}\nTipo: ${tipo}\nFecha de comienzo: ${fechacomienzo}\nFecha de finalización: ${fechafin}`, buttonText: "Ver clasificación", buttonUrl: `Ver la clasificación de la ${nombre}` }));
          }else{
            agent.add(new Card({ title: `Nombre: ${nombre}`, imageUrl: logo, text: `País: ${pais}\nTipo: ${tipo}\nFecha de comienzo: ${fechacomienzo}\nFecha de finalización: ${fechafin}`, buttonText: "Añadir a favoritos", buttonUrl: "Añadir la competición a favoritos" }));
            agent.add(new Card({ title: `Clasificación de la ${nombre}`, buttonText: "Ver clasificación", buttonUrl: `Ver la clasificación de la ${nombre}` }));
          }
          agent.add(new Card({ title: `Lista de máximos goleadores de la ${nombre}`, buttonText: "Ver lista de máximos goleadores", buttonUrl: `Ver los máximos goleadores de la ${nombre}` }));
          agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname, "competicion": nombre, "logo": logo, "pais": pais } });
          });
          
      }
    });
    
  }
  
  function handleBuscarCompeticion(agent) {
    const nickname = agent.parameters.nickname;
    var competicion = agent.parameters.competicion;
    var competicionAux = [competicion];
    if (/\s/.test(competicion)) {
      competicionAux = competicion.split(" ");
    }
    for (var i = 0; i < competicionAux.length; i++) {
      competicionAux[i] = competicionAux[i].charAt(0).toUpperCase() + competicionAux[i].substring(1);
    }
    competicion = competicionAux.join(' ');
    console.log("COMPETICIÓN: " + competicion);
    return refCompeticiones.once('value').then((snapshot) => {
      var aux = snapshot.child(`${competicion}`).val();
      console.log(aux);
      if (aux == null) {
        agent.setFollowupEvent({ "name": "CompeticionAPIenBD", "parameters": { "nickname": nickname, "competicion": competicion} });
      } else {
          let nombre = snapshot.child(`${competicion}`).key;
          let logo = aux.logo;
          let fechacomienzo = aux.fechacomienzo;
          let fechafin = aux.fechafin;
          let pais = aux.país;
          let tipo = aux.tipo;
          let refFavoritos = db.ref(`users/${nickname}/favoritos/competiciones`);
		  return refFavoritos.once('value').then((snapshot) => {
          if (snapshot.child(`${nombre}`).exists()) {
            agent.add(new Card({ title: `Nombre: ${nombre}`, imageUrl: logo, text: `País: ${pais}\nTipo: ${tipo}\nFecha de comienzo: ${fechacomienzo}\nFecha de finalización: ${fechafin}`, buttonText: "Ver clasificación", buttonUrl: `Ver la clasificación de la ${nombre}` }));
          }else{
            agent.add(new Card({ title: `Nombre: ${nombre}`, imageUrl: logo, text: `País: ${pais}\nTipo: ${tipo}\nFecha de comienzo: ${fechacomienzo}\nFecha de finalización: ${fechafin}`, buttonText: "Añadir a favoritos", buttonUrl: "Añadir la competición a favoritos" }));
            agent.add(new Card({ title: `Clasificación de la ${nombre}`, buttonText: "Ver clasificación", buttonUrl: `Ver la clasificación de la ${nombre}` }));
          }
          agent.add(new Card({ title: `Lista de máximos goleadores de la ${nombre}`, buttonText: "Ver lista de máximos goleadores", buttonUrl: `Ver los máximos goleadores de la ${nombre}` }));
          agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname, "competicion": nombre, "logo": logo, "pais": pais } });
          });
          
          
        
      }
    });
  }
  function handleVerificarSiCompeticionExisteEnAPI(agent) {
    const nickname = agent.parameters.nickname;
    const competicion = agent.parameters.competicion;
      var options = {
        method: 'GET',
        url: 'https://v3.football.api-sports.io/leagues',
        params: { name: `${competicion}`, season: 2020 },
        headers: {
          'x-rapidapi-host': 'v3.football.api-sports.io',
          'x-rapidapi-key': apiKey,
        }
      };
    return axios.request(options).then(function (response) {
      let results = response.data.results;
      console.log("RESULTADOS:" + results);
      console.log(response.data.errors);
      if (results == 0) {
        console.log("HAY ERRORES");
        agent.add("Vaya, parece que esa competición no existe o no soy capaz de encontrarla. Por favor, asegúrate de que estás escribiendo el nombre correctamente y evita cosas como las tildes.");
        agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
      } else {
        console.log("NO HAY ERRORES");
        let respuesta = response.data.response[0];
        let nombre = respuesta.league.name;
        let idAPI = respuesta.league.id;
        let logo = respuesta.league.logo;
        let fechacomienzoAPI = respuesta.seasons[0].start.split('-');
        let fechacomienzo = fechacomienzoAPI[2] + "-" + fechacomienzoAPI[1] + "-" + fechacomienzoAPI[0];
        let pais = respuesta.country.name;
        let fechafinAPI = respuesta.seasons[0].end.split('-');
        let fechafin = fechafinAPI[2] + "-" + fechafinAPI[1] + "-" + fechafinAPI[0];
        let tipo = respuesta.league.type.charAt(0).toLowerCase() + respuesta.league.type.slice(1);
        console.log("DATA:" + JSON.stringify(respuesta));
        agent.setFollowupEvent({ "name": "MostrarCompeticionAPI", "parameters": { "nickname": nickname, "nombre": nombre, "idAPI": idAPI, "logo": logo, "pais": pais, "fechacomienzo": fechacomienzo, "tipo": tipo, "fechafin": fechafin } });

      }
    }).catch(function (error) {
      console.error(error);
    });

  }

  function handleMostrarCompeticionAPI(agent) {
    const nickname = agent.parameters.nickname;
    const nombre = agent.parameters.nombre;
    const idAPI = agent.parameters.idAPI;
    const logo = agent.parameters.logo;
    const fechacomienzo = agent.parameters.fechacomienzo;
    var pais = agent.parameters.pais;
    var tipo = agent.parameters.tipo;
    const fechafin = agent.parameters.fechafin;

    return translate(pais, { from: "en", to: "es", engine: "google", key: translateKey }).then(text => {
      pais = text;
      return translate(tipo, { from: "en", to: "es", engine: "google", key: translateKey }).then(text => {
        if (text === "taza") {
          tipo = "Copa";
          agent.add(new Card({ title: `Nombre: ${nombre}`, imageUrl: logo, text: `País: ${pais}\nTipo: ${tipo}\nFecha de comienzo: ${fechacomienzo}\nFecha de finalización: ${fechafin}` }));
          agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname, "competicion": nombre, "logo": logo } });
          //return refCompeticiones.once('value').then((snapshot) =>{
          //if (snapshot.child(`${nombre}`).exists()){
          //console.log("No se añade a BD.");
          //} else {
          //refCompeticiones.child(`${nombre}`).set({
          //logo : logo,
          //fechacomienzo : fechacomienzo,
          //idAPI : idAPI,
          //fechafin : fechafin,
          //país : pais,
          //tipo : tipo,
          //});
          //}
          // });
        } else {
          tipo = text;
          agent.add(new Card({ title: `Nombre: ${nombre}`, imageUrl: logo, text: `País: ${pais}\nTipo: ${tipo}\nFecha de comienzo: ${fechacomienzo}\nFecha de finalización: ${fechafin}` }));
          agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname, "competicion": nombre, "logo": logo } });
          //return refCompeticiones.once('value').then((snapshot) =>{
          //if (snapshot.child(`${nombre}`).exists()){
          //console.log("No se añade a BD.");
          //} else {
          //refCompeticiones.child(`${nombre}`).set({
          //logo : logo,
          //fechacomienzo : fechacomienzo,
          //idAPI : idAPI,
          //fechafin : fechafin,
          //país : pais,
          //tipo : tipo,
          //});
          //}
          // });
        }
      });
    });
  }

  //=========================================================================================================================================================================
  //LISTA DE COMPETICIONES FAVORITAS
  //=========================================================================================================================================================================
  function handleCompeticionAFavoritos(agent) {
    const nickname = agent.parameters.nickname;
    const nombre = agent.parameters.competicion;
    const logo = agent.parameters.logo;
    const pais = agent.parameters.pais;
    let refFavoritos = db.ref(`users/${nickname}/favoritos/competiciones`);
    return refCompeticiones.once('value').then((snapshot) => {
      var aux = snapshot.child(`${nombre}`).val();
      console.log(aux);
      if (aux == null) {
        agent.add("Solo se pueden añadir a favoritos las competiciones de las grandes ligas europeas, que son las primeras divisiones de España, Portugal, Francia, Italia, Inglaterra, Alemania, Países Bajos y Bélgica.");
        agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
      } else {
        return refFavoritos.once('value').then((snapshot) => {
          if (snapshot.child(`${nombre}`).exists()) {
            agent.add("Esa competición ya se encuentra en tu lista de favoritos, prueba a añadir otra.");
            agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
          }
          else if (snapshot.numChildren() < 5) {
            refFavoritos.child(`${nombre}`).set({
              logo: logo,
              pais: pais
            });

            agent.add("Competición añadida a favoritos.");
            agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
          }
          else {
            agent.add("No se pueden añadir más competiciones a la lista de favoritos. Esta puede tener un máximo de 5, si quieres añadir más, prueba a borrar de la lista otra competición que te interese menos.");
            agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
          }
        });
      }
    });
  }

  function handleEliminarCompeticionFavoritos(agent) {
    const nickname = agent.parameters.nickname;
    const competicion = agent.parameters.competicion;
    let refFavoritos = db.ref(`users/${nickname}/favoritos/competiciones`);
    return refCompeticiones.once('value').then((snapshot) => {
      var aux = snapshot.child(`${competicion}`).val();
      console.log(aux);
      if (aux == null) {
        agent.add("No se puede eliminar una competición de la lista de favoritos si esta no está registrada.");
        agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
      } else {
        return refFavoritos.once('value').then((snapshot) => {
          if (snapshot.child(`${competicion}`).exists()) {
            let refFavorito = db.ref(`users/${nickname}/favoritos/competiciones/${competicion}`);
            agent.add("La competición se ha eliminado correctamente de tu lista de competiciones favoritas.");
            agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
            return refFavorito.remove();
          } else {
            agent.add("No se puede eliminar una competición de la lista de competiciones favoritas si esta no se encuentra en la misma.");
            agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
          }
        });
      }
    });
  }

  function handleListarCompeticionesFavoritas(agent) {
    const nickname = agent.parameters.nickname;
    let refFavoritos = db.ref(`users/${nickname}/favoritos/competiciones`);
    return refFavoritos.once('value').then((snapshot) => {
      console.log(snapshot.exists());
      if (snapshot.exists()) {
        return snapshot.forEach((childSnapshot) => {

          var aux = childSnapshot.val();
          let nombre = childSnapshot.key;
          let logo = aux.logo;
          let pais = aux.pais;
          agent.add(new Card({ title: `Nombre: ${nombre}`, imageUrl: logo, text: `País: ${pais}`, buttonText: "Ver detalles", buttonUrl: `Quiero información sobre la competición ${nombre}` }));
          agent.add(new Card({ title: `Nombre: ${nombre}`, buttonText: "Quitar de favoritos", buttonUrl: `Quiero eliminar la competición ${nombre} de favoritos` }));
          agent.add(new Card({ title: `Clasificación de la ${nombre}`, buttonText: "Ver clasificación", buttonUrl: `Ver la clasificación de la ${nombre}` }));
          agent.add(new Card({ title: `Lista de máximos goleadores de la ${nombre}`, buttonText: "Ver lista de máximos goleadores", buttonUrl: `Ver los máximos goleadores de la ${nombre}` }));
          agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });

        });
      } else {
        agent.add("Vaya, parece que tu lista de favoritos está vacía. Puedes añadir competiciones a tu lista de favoritos al buscar información sobre ellas.");
        agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
      }
    });
  }
  //=========================================================================================================================================================================
  //VER Y EDITAR DATOS PERSONALES DEL USUARIO
  //=====================================================================================================================================
  function handleVerDatos(agent) {
    const nickname = agent.parameters.nickname;
    console.log(nickname);
    let refUsuario = db.ref(`users/${nickname}`);
    return refUsuario.once('value').then((snapshot) => {
      var aux = snapshot.val();
      let nickname = snapshot.key;
      let nombre = aux.nombre;
      let apellidos = aux.apellidos;
      let email = aux.email;
      agent.add(new Card({ title: `Datos del usuario ${nickname}`, text: `Nombre: ${nombre}\nApellidos: ${apellidos}\nEmail: ${email}`, buttonText: "Editar", buttonUrl: `Quiero editar mi información de usuario` }));
      agent.add(new Card({ title: `Cerrar sesión actual`, text: `Para salir de tu perfil en el que estás ahora y volver a la pantalla principal, pulsa el siguiente botón.`, buttonText: "Cerrar sesión", buttonUrl: `Quiero cerrar sesión` }));
      agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });

    });
  }

  function handleCerrarSesionYes(agent) {
    agent.add(new Card({ title: `Cierre de sesión efectuado`, text: `Se ha cerrado tu sesión correctamente.` }));
    agent.setFollowupEvent({ "name": "Welcome", "lifespan": 1 });
  }

  function handleEditarDatos(agent) {
    const nickname = agent.parameters.nickname;
    agent.add(new Card({ title: `Datos del usuario ${nickname}`, text: `Por favor, escribe el nombre del dato que te gustaría editar. Puedes modificar cualquier dato, incluida tu contraseña, pero no tu nombre de usuario.`, buttonText: "Cancelar", buttonUrl: `Cancelar` }));
    agent.setContext({ "name": "EditarDatos", "lifespan": 1, "parameters": { "nickname": nickname } });
  }

  function handleEditarNombreBD(agent) {
    const nickname = agent.parameters.nickname;
    const nombre = agent.parameters.nombre;
    let refUsuario = db.ref(`users/${nickname}`);
    return refUsuario.once('value').then((snapshot) => {
      let aux = snapshot.val();
      let nombreBD = aux.nombre;
      if (nombre == nombreBD) {
        agent.add(new Card({ title: `Datos del usuario ${nickname}`, text: `De acuerdo ${nombreBD}, te seguirás llamando igual. Si quieres editar otro dato, por favor escribe el nombre del mismo.`, buttonText: "Cancelar", buttonUrl: `Cancelar` }));
        agent.setContext({ "name": "EditarDatos", "lifespan": 1, "parameters": { "nickname": nickname } });
      } else {
        refUsuario.update({
          nombre: nombre
        });
        agent.add(new Card({ title: `Datos del usuario ${nickname}`, text: `Genial ${nombre}, tu nombre se ha actualizado correctamente. Si quieres editar otro dato, por favor escribe el nombre del mismo.`, buttonText: "Cancelar", buttonUrl: `Cancelar` }));
        agent.setContext({ "name": "EditarDatos", "lifespan": 1, "parameters": { "nickname": nickname } });
      }
    });
  }

  function handleEditarApellidosBD(agent) {
    const nickname = agent.parameters.nickname;
    const apellidos = agent.parameters.apellidos;
    let refUsuario = db.ref(`users/${nickname}`);
    return refUsuario.once('value').then((snapshot) => {
      let aux = snapshot.val();
      let nombre = aux.nombre;
      let apellidosBD = aux.apellidos;
      if (apellidos == apellidosBD) {
        agent.add(new Card({ title: `Datos del usuario ${nickname}`, text: `De acuerdo ${nombre} ${apellidosBD}, te seguirás llamando igual. Si quieres editar otro dato, por favor escribe el nombre del mismo.`, buttonText: "Cancelar", buttonUrl: `Cancelar` }));
        agent.setContext({ "name": "EditarDatos", "lifespan": 1, "parameters": { "nickname": nickname } });
      } else {
        refUsuario.update({
          apellidos: apellidos
        });
        agent.add(new Card({ title: `Datos del usuario ${nickname}`, text: `Genial ${nombre} ${apellidos}, tu apellido o apellidos se han actualizado correctamente. Si quieres editar otro dato, por favor escribe el nombre del mismo.`, buttonText: "Cancelar", buttonUrl: `Cancelar` }));
        agent.setContext({ "name": "EditarDatos", "lifespan": 1, "parameters": { "nickname": nickname } });
      }
    });
  }

  function handleEditarEmailBD(agent) {
    const nickname = agent.parameters.nickname;
    const email = agent.parameters.email;
    let refUsuario = db.ref(`users/${nickname}`);
    return refUsuario.once('value').then((snapshot) => {
      let aux = snapshot.val();
      let emailBD = aux.email;
      if (email == emailBD) {
        agent.add(new Card({ title: `Datos del usuario ${nickname}`, text: `De acuerdo, tu email seguirá siendo ${emailBD}. Si quieres editar otro dato, por favor escribe el nombre del mismo.`, buttonText: "Cancelar", buttonUrl: `Cancelar` }));
        agent.setContext({ "name": "EditarDatos", "lifespan": 1, "parameters": { "nickname": nickname } });
      } else {
        refUsuario.update({
          email: email
        });
        agent.add(new Card({ title: `Datos del usuario ${nickname}`, text: `Recibido, tu email se ha actualizado correctamente, ahora es ${email}. Si quieres editar otro dato, por favor escribe el nombre del mismo.`, buttonText: "Cancelar", buttonUrl: `Cancelar` }));
        agent.setContext({ "name": "EditarDatos", "lifespan": 1, "parameters": { "nickname": nickname } });
      }
    });
  }

  function handleEditarPasswordVerificacion(agent) {
    const nickname = agent.parameters.nickname;
    const contraseña = agent.parameters.password;
    return refUsuarios.once('value').then((snapshot) => {
      var aux = snapshot.child(`${nickname}/contraseña`).val();
      console.log("pass=" + aux);
      if (aux != contraseña) {
        agent.add(new Card({ title: `Datos del usuario ${nickname}`, text: `La contraseña no es correcta para el usuario ${nickname}. Por favor, revisa que está bien escrita e inténtalo de nuevo.`, buttonText: "Cancelar", buttonUrl: `Cancelar` }));
        agent.setContext({ "name": "EditarPassword-followup", "lifespan": 1, "parameters": { "nickname": nickname } });
      } else {
        agent.add(new Card({ title: `Datos del usuario ${nickname}`, text: `Muy bien ${nickname}. Por favor, introduce ahora la que quieres que sea tu nueva contraseña.`, buttonText: "Cancelar", buttonUrl: `Cancelar` }));
        agent.setContext({ "name": "EditarPasswordVerificacion-followup", "lifespan": 1, "parameters": { "nickname": nickname } });

      }
    });

  }

  function handleEditarPasswordBD(agent) {
    const nickname = agent.parameters.nickname;
    const contraseña = agent.parameters.password;
    let refUsuario = db.ref(`users/${nickname}`);
    if (contraseña.length < 6) {
      agent.add(new Card({ title: `Datos del usuario ${nickname}`, text: `Lo siento, esa contraseña es demasiado corta, debe tener mínimo 6 caracteres.`, buttonText: "Cancelar", buttonUrl: `Cancelar` }));
      agent.setContext({ "name": "EditarPasswordVerificacion-followup", "lifespan": 1, "parameters": { "nickname": nickname } });
    } else if (contraseña.length > 20) {
      agent.add(new Card({ title: `Datos del usuario ${nickname}`, text: `Lo siento, esa contraseña es demasiado larga, debe tener máximo 20 caracteres.`, buttonText: "Cancelar", buttonUrl: `Cancelar` }));
      agent.setContext({ "name": "EditarPasswordVerificacion-followup", "lifespan": 1, "parameters": { "nickname": nickname } });
    } else if (contraseña.search(/\d/) == -1) {
      agent.add(new Card({ title: `Datos del usuario ${nickname}`, text: `La contraseña debe tener al menos 1 número. Inténtalo de nuevo por favor.`, buttonText: "Cancelar", buttonUrl: `Cancelar` }));
      agent.setContext({ "name": "EditarPasswordVerificacion-followup", "lifespan": 1, "parameters": { "nickname": nickname } });
    } else if (contraseña.search(/[a-z]/) == -1) {
      agent.add(new Card({ title: `Datos del usuario ${nickname}`, text: `La contraseña debe tener al menos 1 letra minúscula. Inténtalo de nuevo por favor.`, buttonText: "Cancelar", buttonUrl: `Cancelar` }));
      agent.setContext({ "name": "EditarPasswordVerificacion-followup", "lifespan": 1, "parameters": { "nickname": nickname } });
    } else if (contraseña.search(/[A-Z]/) == -1) {
      agent.add(new Card({ title: `Datos del usuario ${nickname}`, text: `La contraseña debe tener al menos 1 letra mayúscula. Inténtalo de nuevo por favor.`, buttonText: "Cancelar", buttonUrl: `Cancelar` }));
      agent.setContext({ "name": "EditarPasswordVerificacion-followup", "lifespan": 1, "parameters": { "nickname": nickname } });
    } else {
      return refUsuario.once('value').then((snapshot) => {
        let aux = snapshot.val();
        let contraseñaBD = aux.contraseña;
        if (contraseña == contraseñaBD) {
          agent.add(new Card({ title: `Datos del usuario ${nickname}`, text: `De acuerdo, tu contraseña se ha quedado como estaba. Si quieres modificar otro dato, indícame su nombre en tu próximo mensaje.`, buttonText: "Cancelar", buttonUrl: `Cancelar` }));
          agent.setContext({ "name": "EditarDatos", "lifespan": 1, "parameters": { "nickname": nickname } });
        } else {
          refUsuario.update({
            contraseña: contraseña
          });
          agent.add(new Card({ title: `Datos del usuario ${nickname}`, text: `La contraseña se ha actualizado correctamente. Si quieres modificar otro dato, indícame su nombre en tu próximo mensaje.`, buttonText: "Cancelar", buttonUrl: `Cancelar` }));
          agent.setContext({ "name": "EditarDatos", "lifespan": 1, "parameters": { "nickname": nickname } });
        }
      });

    }

  }

  //=========================================================================================================================================================================
  //AYUDA EN HOME
  //=====================================================================================================================================
  function handleAyuda(agent) {
    const nickname = agent.parameters.nickname;
    agent.add(new Card({ title: `Ayuda al usuario`, text: `Te doy la bienvenida a la sección de ayuda del chatbot. Por favor, escribe la categoría sobre la que necesitas ayuda de entre las que te voy a exponer a continuación:\n-Equipos\n-Competiciones\n-Jugadores\n-Jornadas\n-Usuarios`, buttonText: "Cancelar", buttonUrl: `Cancelar` }));
    agent.setContext({ "name": "HomeAyuda", "lifespan": 1, "parameters": { "nickname": nickname } });
  }

  function handleAyudaFallback(agent) {
    const nickname = agent.parameters.nickname;
    agent.add(new Card({ title: `Ayuda al usuario`, text: `No entendí tu mensaje. Por favor, escribe la categoría sobre la que necesitas ayuda de aquellas que te expondré ahora:\n-Equipos\n-Competiciones\n-Jugadores\n-Jornadas\n-Usuarios`, buttonText: "Cancelar", buttonUrl: `Cancelar` }));
    agent.setContext({ "name": "HomeAyuda", "lifespan": 1, "parameters": { "nickname": nickname } });
  }

  function handleAyudaEquipos(agent) {
    const nickname = agent.parameters.nickname;
    agent.add(new Card({ title: `Ayuda al usuario`, text: `Esto es la sección de equipos. ¿Sobre qué quieres que te ayude?:\n-Buscar información de equipos\n-Buscar estadísticas de un equipo en una competición\n-Buscar estadísticas de un equipo en una jornada\n-Añadir equipo a favoritos\n-Ver lista de equipos favoritos`, buttonText: "Cancelar", buttonUrl: `Cancelar` }));
    agent.setContext({ "name": "HomeAyudaEquipos", "lifespan": 1, "parameters": { "nickname": nickname } });
  }
  function handleAyudaEquiposFallback(agent) {
    const nickname = agent.parameters.nickname;
    agent.add(new Card({ title: `Ayuda al usuario`, text: `No entendí tu mensaje. Por favor, indícame sobre qué aspecto de los equipos quieres que te ayude:\n-Buscar información de equipos\n-Buscar estadísticas de un equipo en una competición\n-Buscar estadísticas de un equipo en una jornada\n-Añadir equipo a favoritos\n-Ver lista de equipos favoritos`, buttonText: "Cancelar", buttonUrl: `Cancelar` }));
    agent.setContext({ "name": "HomeAyudaEquipos", "lifespan": 1, "parameters": { "nickname": nickname } });
  }

  function handleAyudaCompeticiones(agent) {
    const nickname = agent.parameters.nickname;
    agent.add(new Card({ title: `Ayuda al usuario`, text: `Esto es la sección de competiciones. ¿Sobre qué quieres recibir soporte?:\n-Buscar información de competiciones\n-Buscar nombre de la competición de un país\n-Ver clasificación de una competición\n-Ver lista de máximos goleadores de una competición\n-Añadir competición a favoritos\n-Ver lista de competiciones favoritas`, buttonText: "Cancelar", buttonUrl: `Cancelar` }));
    agent.setContext({ "name": "HomeAyudaCompeticiones", "lifespan": 1, "parameters": { "nickname": nickname } });
  }
  function handleAyudaCompeticionesFallback(agent) {
    const nickname = agent.parameters.nickname;
    agent.add(new Card({ title: `Ayuda al usuario`, text: `No entendí tu mensaje. Por favor, indícame sobre qué aspecto de las competiciones quieres que te ayude:\n-Buscar información de competiciones\n-Buscar nombre de la competición de un país\n-Ver clasificación de una competición\n-Ver lista de máximos goleadores de una competición\n-Añadir competición a favoritos\n-Ver lista de competiciones favoritas`, buttonText: "Cancelar", buttonUrl: `Cancelar` }));
    agent.setContext({ "name": "HomeAyudaCompeticiones", "lifespan": 1, "parameters": { "nickname": nickname } });
  }

  function handleAyudaJugadores(agent) {
    const nickname = agent.parameters.nickname;
    agent.add(new Card({ title: `Ayuda al usuario`, text: `Esto es la sección de jugadores. ¿Sobre qué quieres que te ayude?:\n-Buscar información de un jugador\n-Ver estadísticas de un jugador en una competición`, buttonText: "Cancelar", buttonUrl: `Cancelar` }));
    agent.setContext({ "name": "HomeAyudaJugadores", "lifespan": 1, "parameters": { "nickname": nickname } });
  }
  function handleAyudaJugadoresFallback(agent) {
    const nickname = agent.parameters.nickname;
    agent.add(new Card({ title: `Ayuda al usuario`, text: `No entendí tu mensaje. Por favor, indícame sobre qué aspecto de los jugadores quieres que te ayude:\n-Buscar información de un jugador\n-Ver estadísticas de un jugador en una competición`, buttonText: "Cancelar", buttonUrl: `Cancelar` }));
    agent.setContext({ "name": "HomeAyudaJugadores", "lifespan": 1, "parameters": { "nickname": nickname } });
  }

  function handleAyudaJornadas(agent) {
    const nickname = agent.parameters.nickname;
    agent.add(new Card({ title: `Ayuda al usuario`, text: `Esto es la sección de jornadas. ¿Sobre qué quieres recibir ayuda?:\n-Buscar próxima jornada que tiene que jugar un equipo en una competición\n-Buscar útlima jornada que ha jugado un equipo en una competición\n-Buscar jornada concreta de un equipo en una competición\n-Ver alineación de un equipo en una jornada de una competición`, buttonText: "Cancelar", buttonUrl: `Cancelar` }));
    agent.setContext({ "name": "HomeAyudaJornadas", "lifespan": 1, "parameters": { "nickname": nickname } });
  }
  function handleAyudaJornadasFallback(agent) {
    const nickname = agent.parameters.nickname;
    agent.add(new Card({ title: `Ayuda al usuario`, text: `No entendí tu mensaje. Por favor, indícame con qué aspecto de las jornadas quieres que te ayude:\n-Buscar próxima jornada que tiene que jugar un equipo en una competición\n-Buscar útlima jornada que ha jugado un equipo en una competición\n-Buscar jornada concreta de un equipo en una competición\n-Ver alineación de un equipo en una jornada de una competición`, buttonText: "Cancelar", buttonUrl: `Cancelar` }));
    agent.setContext({ "name": "HomeAyudaJornadas", "lifespan": 1, "parameters": { "nickname": nickname } });
  }

  function handleAyudaUsuarios(agent) {
    const nickname = agent.parameters.nickname;
    agent.add(new Card({ title: `Ayuda al usuario`, text: `Esto es la sección de usuarios. ¿Sobre qué quieres recibir ayuda?:\n-Ver datos de usuario\n-Editar datos de usuario`, buttonText: "Cancelar", buttonUrl: `Cancelar` }));
    agent.setContext({ "name": "HomeAyudaUsuarios", "lifespan": 1, "parameters": { "nickname": nickname } });
  }
  function handleAyudaUsuariosFallback(agent) {
    const nickname = agent.parameters.nickname;
    agent.add(new Card({ title: `Ayuda al usuario`, text: `No entendí tu mensaje. Por favor, indícame con qué aspecto de los usuarios quieres que te ayude:\n-Ver datos de usuario\n-Editar datos de usuario`, buttonText: "Cancelar", buttonUrl: `Cancelar` }));
    agent.setContext({ "name": "HomeAyudaUsuarios", "lifespan": 1, "parameters": { "nickname": nickname } });
  }

  function handleCancelarAyudaEquipos(agent) {
    const nickname = agent.parameters.nickname;
    agent.add(new Card({ title: `Ayuda al usuario`, text: `Entendido, volviendo a la página principal de ayuda. Si quieres con alguna otra cosa, por favor indícame cuál:\n-Equipos\n-Competiciones\n-Jugadores\n-Jornadas\n-Usuarios`, buttonText: "Cancelar", buttonUrl: `Cancelar` }));
  }

  function handleCancelarAyudaCompeticiones(agent) {
    const nickname = agent.parameters.nickname;
    agent.add(new Card({ title: `Ayuda al usuario`, text: `Entendido, volviendo a la página principal de ayuda. Si quieres con alguna otra cosa, por favor indícame cuál:\n-Equipos\n-Competiciones\n-Jugadores\n-Jornadas\n-Usuarios`, buttonText: "Cancelar", buttonUrl: `Cancelar` }));
  }

  function handleCancelarAyudaJugadores(agent) {
    const nickname = agent.parameters.nickname;
    agent.add(new Card({ title: `Ayuda al usuario`, text: `Entendido, volviendo a la página principal de ayuda. Si quieres con alguna otra cosa, por favor indícame cuál:\n-Equipos\n-Competiciones\n-Jugadores\n-Jornadas\n-Usuarios`, buttonText: "Cancelar", buttonUrl: `Cancelar` }));
  }

  function handleCancelarAyudaJornadas(agent) {
    const nickname = agent.parameters.nickname;
    agent.add(new Card({ title: `Ayuda al usuario`, text: `Entendido, volviendo a la página principal de ayuda. Si quieres con alguna otra cosa, por favor indícame cuál:\n-Equipos\n-Competiciones\n-Jugadores\n-Jornadas\n-Usuarios`, buttonText: "Cancelar", buttonUrl: `Cancelar` }));
  }

  function handleCancelarAyudaUsuarios(agent) {
    const nickname = agent.parameters.nickname;
    agent.add(new Card({ title: `Ayuda al usuario`, text: `Entendido, volviendo a la página principal de ayuda. Si quieres con alguna otra cosa, por favor indícame cuál:\n-Equipos\n-Competiciones\n-Jugadores\n-Jornadas\n-Usuarios`, buttonText: "Cancelar", buttonUrl: `Cancelar` }));
  }

  function handleAyudaEquiposInfo(agent) {
    const nickname = agent.parameters.nickname;
    agent.add(new Card({ title: `Ayuda al usuario`, text: `Para buscar información sobre un equipo, solo tienes que escribir "Quiero información sobre el " y a continuación el nombre del equipo. Por ejemplo: "Quiero información sobre el Betis".` }));
    agent.add(new Card({ title: `Ayuda al usuario`, text: `¿Necesitas ayuda con alguna otra cosa relacionada con los equipos? En ese caso, escribe aquello sobre lo que necesites ayuda:\n-Buscar información de equipos\n-Buscar estadísticas de un equipo en una competición\n-Buscar estadísticas de un equipo en una jornada\n-Añadir equipo a favoritos\n-Ver lista de equipos favoritos`, buttonText: "Cancelar", buttonUrl: `Cancelar` }));
    agent.setContext({ "name": "HomeAyudaEquipos", "lifespan": 1, "parameters": { "nickname": nickname } });
  }

  function handleAyudaEquiposCompeticion(agent) {
    const nickname = agent.parameters.nickname;
    agent.add(new Card({ title: `Ayuda al usuario`, text: `Para buscar estadísticas de un equipo en una competición basta con escribir "Quiero información sobre las estadísitcas del " seguido del nombre del equipo y luego "en " seguido del nombre de la competición. Por ejemplo: "Quiero información sobre las estadísticas del Betis en Primera Division".` }));
    agent.add(new Card({ title: `Ayuda al usuario`, text: `¿Necesitas ayuda con alguna otra cosa relacionada con los equipos? En ese caso, escribe aquello sobre lo que necesites ayuda:\n-Buscar información de equipos\n-Buscar estadísticas de un equipo en una competición\n-Buscar estadísticas de un equipo en una jornada\n-Añadir equipo a favoritos\n-Ver lista de equipos favoritos`, buttonText: "Cancelar", buttonUrl: `Cancelar` }));
    agent.setContext({ "name": "HomeAyudaEquipos", "lifespan": 1, "parameters": { "nickname": nickname } });
  }

  function handleAyudaEquiposJornada(agent) {
    const nickname = agent.parameters.nickname;
    agent.add(new Card({ title: `Ayuda al usuario`, text: `Para buscar estadísticas de un equipo en una jornada de una competición, debes primero buscar información sobre esa jornada para ese equipo en cuestión, y una vez ahí aparecerán los botones para ver las estadísticas de cada equipo.` }));
    agent.add(new Card({ title: `Ayuda al usuario`, text: `¿Necesitas ayuda con alguna otra cosa relacionada con los equipos? En ese caso, escribe aquello sobre lo que necesites ayuda:\n-Buscar información de equipos\n-Buscar estadísticas de un equipo en una competición\n-Buscar estadísticas de un equipo en una jornada\n-Añadir equipo a favoritos\n-Ver lista de equipos favoritos`, buttonText: "Cancelar", buttonUrl: `Cancelar` }));
    agent.setContext({ "name": "HomeAyudaEquipos", "lifespan": 1, "parameters": { "nickname": nickname } });
  }

  function handleAyudaEquiposFavoritos(agent) {
    const nickname = agent.parameters.nickname;
    agent.add(new Card({ title: `Ayuda al usuario`, text: `Para añadir un equipo a favoritos, basta con buscar información sobre el mismo y aparecerá el botón de añadir dicho equipo a favoritos. Debo recordarte que puedes tener como máximo 5 equipos en la lista de favoritos, y que si quisieras añadir otro teniendo tu lista llena tendría que eliminar alguno de la lista.` }));
    agent.add(new Card({ title: `Ayuda al usuario`, text: `¿Necesitas ayuda con alguna otra cosa relacionada con los equipos? En ese caso, escribe aquello sobre lo que necesites ayuda:\n-Buscar información de equipos\n-Buscar estadísticas de un equipo en una competición\n-Buscar estadísticas de un equipo en una jornada\n-Añadir equipo a favoritos\n-Ver lista de equipos favoritos`, buttonText: "Cancelar", buttonUrl: `Cancelar` }));
    agent.setContext({ "name": "HomeAyudaEquipos", "lifespan": 1, "parameters": { "nickname": nickname } });
  }

  function handleAyudaEquiposLista(agent) {
    const nickname = agent.parameters.nickname;
    agent.add(new Card({ title: `Ayuda al usuario`, text: `Para ver la lista de tus equipos favoritos, basta con escribir algo como "Listar mis equipos favoritos".` }));
    agent.add(new Card({ title: `Ayuda al usuario`, text: `¿Necesitas ayuda con alguna otra cosa relacionada con los equipos? En ese caso, escribe aquello sobre lo que necesites ayuda:\n-Buscar información de equipos\n-Buscar estadísticas de un equipo en una competición\n-Buscar estadísticas de un equipo en una jornada\n-Añadir equipo a favoritos\n-Ver lista de equipos favoritos`, buttonText: "Cancelar", buttonUrl: `Cancelar` }));
    agent.setContext({ "name": "HomeAyudaEquipos", "lifespan": 1, "parameters": { "nickname": nickname } });
  }

  function handleAyudaCompeticionesInfo(agent) {
    const nickname = agent.parameters.nickname;
    agent.add(new Card({ title: `Ayuda al usuario`, text: `Para buscar información sobre una competición de entre las grandes ligas de Europa (primera división de España, Inglaterra, Italia, Francia, Alemania, Países Bajos, Bélgica y Portugal) solo tienes que escribir "Quiero información sobre la competición " y a continuación el nombre de la competición. Por ejemplo: "Quiero información sobre la competición Premier League". Si quieres buscar información sobre otras competiciones que no sean las que ofrezco, puedes buscarlas añadiendo además el nombre del país, por ejemplo "Quiero información sobre la competición Tipp3 Bundesliga de Austria` }));
    agent.add(new Card({ title: `Ayuda al usuario`, text: `¿Necesitas ayuda con alguna otra cosa relacionada con las competiciones? En ese caso, escribe aquello sobre lo que necesites ayuda:\n-Buscar información de competiciones\n-Buscar nombre de la competición de un país\n-Ver clasificación de una competición\n-Ver lista de máximos goleadores de una competición\n-Añadir competición a favoritos\n-Ver lista de competiciones favoritas`, buttonText: "Cancelar", buttonUrl: `Cancelar` }));
    agent.setContext({ "name": "HomeAyudaCompeticiones", "lifespan": 1, "parameters": { "nickname": nickname } });
  }

  function handleAyudaCompeticionPais(agent) {
    const nickname = agent.parameters.nickname;
    agent.add(new Card({ title: `Ayuda al usuario`, text: `Para buscar el nombre de la competición de uno de los principales países europeos en cuanto a fútbol (España, Inglaterra, Italia, Francia, Alemania, Países Bajos, Bélgica y Portugal), haría falta escribir algo como "Quiero saber el nombre de la competición de " seguido del nombre del país. Por ejemplo: "Quiero saber el nombre de la competición de Portugal".` }));
    agent.add(new Card({ title: `Ayuda al usuario`, text: `¿Necesitas ayuda con alguna otra cosa relacionada con las competiciones? En ese caso, escribe aquello sobre lo que necesites ayuda:\n-Buscar información de competiciones\n-Buscar nombre de la competición de un país\n-Ver clasificación de una competición\n-Ver lista de máximos goleadores de una competición\n-Añadir competición a favoritos\n-Ver lista de competiciones favoritas`, buttonText: "Cancelar", buttonUrl: `Cancelar` }));
    agent.setContext({ "name": "HomeAyudaCompeticiones", "lifespan": 1, "parameters": { "nickname": nickname } });
  }

  function handleAyudaClasificacionCompeticion(agent) {
    const nickname = agent.parameters.nickname;
    agent.add(new Card({ title: `Ayuda al usuario`, text: `Para ver la clasificación de una competición, debes primero buscar información sobre esa competición , y si la consulta es correcta, además de la información de la competición aparecerá un botón para ver su clasificación. También lo puedes hacer desde tu lista de favoritos.` }));
    agent.add(new Card({ title: `Ayuda al usuario`, text: `¿Necesitas ayuda con alguna otra cosa relacionada con las competiciones? En ese caso, escribe aquello sobre lo que necesites ayuda:\n-Buscar información de competiciones\n-Buscar nombre de la competición de un país\n-Ver clasificación de una competición\n-Ver lista de máximos goleadores de una competición\n-Añadir competición a favoritos\n-Ver lista de competiciones favoritas`, buttonText: "Cancelar", buttonUrl: `Cancelar` }));
    agent.setContext({ "name": "HomeAyudaCompeticiones", "lifespan": 1, "parameters": { "nickname": nickname } });
  }

  function handleAyudaGoleadoresCompeticion(agent) {
    const nickname = agent.parameters.nickname;
    agent.add(new Card({ title: `Ayuda al usuario`, text: `Si quieres ver la lista de máximos goleadores de un equipo, tienes que buscar primero la competición y después pulsar el botón de ver lista de máximos goleadores que aparecerá. Esto también se puede hacer desde la lista de competiciones favoritas.` }));
    agent.add(new Card({ title: `Ayuda al usuario`, text: `¿Necesitas ayuda con alguna otra cosa relacionada con las competiciones? En ese caso, escribe aquello sobre lo que necesites ayuda:\n-Buscar información de competiciones\n-Buscar nombre de la competición de un país\n-Ver clasificación de una competición\n-Ver lista de máximos goleadores de una competición\n-Añadir competición a favoritos\n-Ver lista de competiciones favoritas`, buttonText: "Cancelar", buttonUrl: `Cancelar` }));
    agent.setContext({ "name": "HomeAyudaCompeticiones", "lifespan": 1, "parameters": { "nickname": nickname } });
  }

  function handleAyudaCompeticionesFavoritos(agent) {
    const nickname = agent.parameters.nickname;
    agent.add(new Card({ title: `Ayuda al usuario`, text: `Para añadir una competición a favoritos, basta con buscar información sobre esta y aparecerá el botón de añadir dicha competición a favoritos. Recuerda que puedes añadir un máximo de 5 competiciones a favoritos, si quieres añadir una competición y tu lista está llena tendrás que quitar alguna competición de la lista.` }));
    agent.add(new Card({ title: `Ayuda al usuario`, text: `¿Necesitas ayuda con alguna otra cosa relacionada con las competiciones? En ese caso, escribe aquello sobre lo que necesites ayuda:\n-Buscar información de competiciones\n-Buscar nombre de la competición de un país\n-Ver clasificación de una competición\n-Ver lista de máximos goleadores de una competición\n-Añadir competición a favoritos\n-Ver lista de competiciones favoritas`, buttonText: "Cancelar", buttonUrl: `Cancelar` }));
    agent.setContext({ "name": "HomeAyudaCompeticiones", "lifespan": 1, "parameters": { "nickname": nickname } });
  }

  function handleAyudaCompeticionesLista(agent) {
    const nickname = agent.parameters.nickname;
    agent.add(new Card({ title: `Ayuda al usuario`, text: `Para ver la lista de tus competiciones favoritas, basta con escribir algo como "Listar mis competiciones favoritas".` }));
    agent.add(new Card({ title: `Ayuda al usuario`, text: `¿Necesitas ayuda con alguna otra cosa relacionada con las competiciones? En ese caso, escribe aquello sobre lo que necesites ayuda:\n-Buscar información de competiciones\n-Buscar nombre de la competición de un país\n-Ver clasificación de una competición\n-Ver lista de máximos goleadores de una competición\n-Añadir competición a favoritos\n-Ver lista de competiciones favoritas`, buttonText: "Cancelar", buttonUrl: `Cancelar` }));
    agent.setContext({ "name": "HomeAyudaCompeticiones", "lifespan": 1, "parameters": { "nickname": nickname } });
  }

  function handleAyudaJugadoresInfo(agent) {
    const nickname = agent.parameters.nickname;
    agent.add(new Card({ title: `Ayuda al usuario`, text: `Para buscar la información de un jugador, basta con escribir algo como "Quiero información del jugador " seguido del nombre y "del " seguido del nombre del equipo. Por ejemplo "Quiero información del jugador Haaland del Borussia Dortmund"` }));
    agent.add(new Card({ title: `Ayuda al usuario`, text: `¿Necesitas ayuda con alguna otra cosa relacionada con los jugadores? En ese caso, escribe aquello sobre lo que necesites ayuda:\n-Buscar información de un jugador\n-Ver estadísticas de un jugador en una competición`, buttonText: "Cancelar", buttonUrl: `Cancelar` }));
    agent.setContext({ "name": "HomeAyudaJugadores", "lifespan": 1, "parameters": { "nickname": nickname } });
  }

  function handleAyudaJugadoresCompeticion(agent) {
    const nickname = agent.parameters.nickname;
    agent.add(new Card({ title: `Ayuda al usuario`, text: `Para ver las estadísticas de un jugador en una competición, es necesario escribir algo como "Quiero ver estadísticas del jugador" seguido del nombre del jugador y "de la" seguido del nombre de la competición, como por ejemplo "Quiero ver estadísticas del jugador Haaland de la Bundesliga 1". Esto solo está disponible para las ligas de España, Inglaterra, Italia, Francia, Alemania, Países Bajos, Bélgica y Portugal.` }));
    agent.add(new Card({ title: `Ayuda al usuario`, text: `¿Necesitas ayuda con alguna otra cosa relacionada con los jugadores? En ese caso, escribe aquello sobre lo que necesites ayuda:\n-Buscar información de un jugador\n-Ver estadísticas de un jugador en una competición`, buttonText: "Cancelar", buttonUrl: `Cancelar` }));
    agent.setContext({ "name": "HomeAyudaJugadores", "lifespan": 1, "parameters": { "nickname": nickname } });
  }

  function handleAyudaJornadaProxima(agent) {
    const nickname = agent.parameters.nickname;
    agent.add(new Card({ title: `Ayuda al usuario`, text: `Para ver la próxima jornada que va a jugar un equipo en una competición, tienes que escribir algo como "Quiero ver la próxima jornada del " seguido del nombre del equipo y "de la " seguido del nombre de la competición. Por ejemplo "Quiero ver la próxima jornada del Betis de la Primera Division"` }));
    agent.add(new Card({ title: `Ayuda al usuario`, text: `¿Necesitas ayuda con alguna otra cosa relacionada con las jornadas? En ese caso, escribe aquello sobre lo que necesites ayuda:\n-Buscar próxima jornada que tiene que jugar un equipo en una competición\n-Buscar útlima jornada que ha jugado un equipo en una competición\n-Buscar jornada concreta de un equipo en una competición\n-Ver alineación de un equipo en una jornada de una competición`, buttonText: "Cancelar", buttonUrl: `Cancelar` }));
    agent.setContext({ "name": "HomeAyudaJornadas", "lifespan": 1, "parameters": { "nickname": nickname } });
  }

  function handleAyudaJornadaUltima(agent) {
    const nickname = agent.parameters.nickname;
    agent.add(new Card({ title: `Ayuda al usuario`, text: `Para ver la última jornada que ha jugado un equipo en una competición, tienes que escribir algo como "Quiero ver la última jornada del " seguido del nombre del equipo y "de la " seguido del nombre de la competición. Por ejemplo "Quiero ver la última jornada del Betis de la Primera Division"` }));
    agent.add(new Card({ title: `Ayuda al usuario`, text: `¿Necesitas ayuda con alguna otra cosa relacionada con las jornadas? En ese caso, escribe aquello sobre lo que necesites ayuda:\n-Buscar próxima jornada que tiene que jugar un equipo en una competición\n-Buscar útlima jornada que ha jugado un equipo en una competición\n-Buscar jornada concreta de un equipo en una competición\n-Ver alineación de un equipo en una jornada de una competición`, buttonText: "Cancelar", buttonUrl: `Cancelar` }));
    agent.setContext({ "name": "HomeAyudaJornadas", "lifespan": 1, "parameters": { "nickname": nickname } });
  }

  function handleAyudaJornadaConcreta(agent) {
    const nickname = agent.parameters.nickname;
    agent.add(new Card({ title: `Ayuda al usuario`, text: `Para ver la información de una jornada concreta que haya jugado un equipo en una competición, basta con escribir algo como "Quiero ver información sobre la jornada " seguido del número y "del " seguido del nombre del equipo y "de la " seguido del nombre de la competición. Por ejemplo: "Quiero información sobre la jornada 23 del Sevilla de la Primera Division".` }));
    agent.add(new Card({ title: `Ayuda al usuario`, text: `¿Necesitas ayuda con alguna otra cosa relacionada con las jornadas? En ese caso, escribe aquello sobre lo que necesites ayuda:\n-Buscar próxima jornada que tiene que jugar un equipo en una competición\n-Buscar útlima jornada que ha jugado un equipo en una competición\n-Buscar jornada concreta de un equipo en una competición\n-Ver alineación de un equipo en una jornada de una competición`, buttonText: "Cancelar", buttonUrl: `Cancelar` }));
    agent.setContext({ "name": "HomeAyudaJornadas", "lifespan": 1, "parameters": { "nickname": nickname } });
  }

  function handleAyudaJornadaAlineacion(agent) {
    const nickname = agent.parameters.nickname;
    agent.add(new Card({ title: `Ayuda al usuario`, text: `Para ver la alineación de un equipo en una jornada concreta, basta buscar dicha jornada y pulsar el botón de ver alineación del equipo correspondiente.` }));
    agent.add(new Card({ title: `Ayuda al usuario`, text: `¿Necesitas ayuda con alguna otra cosa relacionada con las jornadas? En ese caso, escribe aquello sobre lo que necesites ayuda:\n-Buscar próxima jornada que tiene que jugar un equipo en una competición\n-Buscar útlima jornada que ha jugado un equipo en una competición\n-Buscar jornada concreta de un equipo en una competición\n-Ver alineación de un equipo en una jornada de una competición`, buttonText: "Cancelar", buttonUrl: `Cancelar` }));
    agent.setContext({ "name": "HomeAyudaJornadas", "lifespan": 1, "parameters": { "nickname": nickname } });
  }

  function handleAyudaUsuarioVer(agent) {
    const nickname = agent.parameters.nickname;
    agent.add(new Card({ title: `Ayuda al usuario`, text: `Para ver tu información de usuario, basta con escribir algo como "Ver mis datos de usuario".` }));
    agent.add(new Card({ title: `Ayuda al usuario`, text: `¿Necesitas ayuda con alguna otra cosa relacionada con la información del usuario? En ese caso, escribe aquello sobre lo que necesites ayuda:\n-Ver datos de usuario\n-Editar datos de usuario`, buttonText: "Cancelar", buttonUrl: `Cancelar` }));
    agent.setContext({ "name": "HomeAyudaUsuarios", "lifespan": 1, "parameters": { "nickname": nickname } });
  }

  function handleAyudaUsuarioEditar(agent) {
    const nickname = agent.parameters.nickname;
    agent.add(new Card({ title: `Ayuda al usuario`, text: `Para editar tu información de usuario, solo tienes que ver tu información de usuario y pulsar el botón de editar que aparecerá.` }));
    agent.add(new Card({ title: `Ayuda al usuario`, text: `¿Necesitas ayuda con alguna otra cosa relacionada con la información del usuario? En ese caso, escribe aquello sobre lo que necesites ayuda:\n-Ver datos de usuario\n-Editar datos de usuario`, buttonText: "Cancelar", buttonUrl: `Cancelar` }));
    agent.setContext({ "name": "HomeAyudaUsuarios", "lifespan": 1, "parameters": { "nickname": nickname } });
  }

  //=========================================================================================================================================================================
  //BUSCAR COMPETICIÓN DE UN PAÍS
  //=====================================================================================================================================
  function handleBuscarCompeticionPais(agent) {
    const nickname = agent.parameters.nickname;
    var location = agent.parameters.location;
    return refCompeticiones.orderByChild('país').equalTo(`${location}`).once('value').then((snapshot) => {
      var aux = snapshot.val();
      console.log(aux);
      if (aux == null) {
        agent.add("No he podido encontrar ninguna competición para ese país. Por favor, ten en cuenta que yo me especializo en las grandes ligas europeas, por lo que ahora mismo no soy capaz de proporcionar este servicio para ligas de otros países. Si ese no es el caso, por favor comprueba que has escrito correctamente el nombre del país. Para más información, escribe 'Ayuda'");

        agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
      } else {
        return snapshot.forEach((childSnapshot) => {
          let datos = childSnapshot.val();
          let nombre = childSnapshot.key;
          let logo = datos.logo;
          let fechacomienzo = datos.fechacomienzo;
          let fechafin = datos.fechafin;
          let pais = datos.país;
          let tipo = datos.tipo;

          agent.add(new Card({ title: `Nombre: ${nombre}`, imageUrl: logo, text: `País: ${pais}\nTipo: ${tipo}\nFecha de comienzo: ${fechacomienzo}\nFecha de finalización: ${fechafin}`, buttonText: "Añadir a favoritos", buttonUrl: "Añadir la competición a favoritos" }));
          agent.add(new Card({ title: `Clasificación de la ${nombre}`, buttonText: "Ver clasificación", buttonUrl: `Ver la clasificación de la ${nombre}` }));
          agent.add(new Card({ title: `Lista de máximos goleadores de la ${nombre}`, buttonText: "Ver lista de máximos goleadores", buttonUrl: `Ver los máximos goleadores de la ${nombre}` }));
          agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname, "competicion": nombre, "logo": logo, "pais": pais } });
        });
      }
    });
  }
  //=========================================================================================================================================================================
  //BUSCAR JUGADOR Y SUS ESTADÍSTICAS
  //=====================================================================================================================================
  function guardarEstadisticas(idAPI, partidosTotales, partidosTitular, minutos, vecesSustituido, vecesDesdeBanquillo, vecesQuedoEnBanquillo, tirosTotales, tirosPuerta, goles, golesRecibidos, asistencias, paradas, pasesTotales, pasesClave, efectividadPases, entradas, bloqueos, robos, duelosTotales, duelosGanados, regatesTotales, regatesExitosos, partidos1Amarilla, partidos2Amarillas, partidosRoja, penaltisRecibidos, penaltisCometidos, penaltisAnotados, penaltisFallados, penaltisParados, fechaHoy, posicion) {
    refJugadores.child(`${idAPI}`).child("estadísticas").set({
      partidosTotales: partidosTotales,
      partidosTitular: partidosTitular,
      minutos: minutos,
      vecesSustituido: vecesSustituido,
      vecesDesdeBanquillo: vecesDesdeBanquillo,
      vecesQuedoEnBanquillo: vecesQuedoEnBanquillo,
      tirosTotales: tirosTotales,
      tirosPuerta: tirosPuerta,
      goles: goles,
      golesRecibidos: golesRecibidos,
      asistencias: asistencias,
      paradas: paradas,
      pasesTotales: pasesTotales,
      pasesClave: pasesClave,
      efectividadPases: efectividadPases,
      entradas: entradas,
      bloqueos: bloqueos,
      robos: robos,
      duelosTotales: duelosTotales,
      duelosGanados: duelosGanados,
      regatesTotales: regatesTotales,
      regatesExitosos: regatesExitosos,
      partidos1Amarilla: partidos1Amarilla,
      partidos2Amarillas: partidos2Amarillas,
      partidosRoja: partidosRoja,
      penaltisRecibidos: penaltisRecibidos,
      penaltisCometidos: penaltisCometidos,
      penaltisAnotados: penaltisAnotados,
      penaltisFallados: penaltisFallados,
      penaltisParados: penaltisParados,
      fecha: fechaHoy,
      posicion: posicion

    });
  }

  function checkLigaEstadisticas(idAPI, partidosTotales, partidosTitular, minutos, vecesSustituido, vecesDesdeBanquillo, vecesQuedoEnBanquillo, tirosTotales, tirosPuerta, goles, golesRecibidos, asistencias, paradas, pasesTotales, pasesClave, efectividadPases, entradas, bloqueos, robos, duelosTotales, duelosGanados, regatesTotales, regatesExitosos, partidos1Amarilla, partidos2Amarillas, partidosRoja, penaltisRecibidos, penaltisCometidos, penaltisAnotados, penaltisFallados, penaltisParados, fechaHoy, posicion, idLigaAPI) {
    refCompeticiones.orderByChild('idAPI').equalTo(idLigaAPI).once('value').then((snapshot) => {
      if (snapshot.exists()) {
        guardarEstadisticas(idAPI, partidosTotales, partidosTitular, minutos, vecesSustituido, vecesDesdeBanquillo, vecesQuedoEnBanquillo, tirosTotales, tirosPuerta, goles, golesRecibidos, asistencias, paradas, pasesTotales, pasesClave, efectividadPases, entradas, bloqueos, robos, duelosTotales, duelosGanados, regatesTotales, regatesExitosos, partidos1Amarilla, partidos2Amarillas, partidosRoja, penaltisRecibidos, penaltisCometidos, penaltisAnotados, penaltisFallados, penaltisParados, fechaHoy, posicion);
      }
    });
  }

  function handleBuscarJugador(agent) {
    var nickname = agent.parameters.nickname;
    var jugador = agent.parameters.jugador;
    var equipo = agent.parameters.equipo;
    var equipoAux = [equipo];
    if (/\s/.test(equipo)) {
      equipoAux = equipo.split(" ");
    }
    for (var i = 0; i < equipoAux.length; i++) {
      equipoAux[i] = equipoAux[i].charAt(0).toUpperCase() + equipoAux[i].substring(1);
    }
    equipo = equipoAux.join(' ');
    if (jugador.includes("-")) {
      let jugadorAux = jugador.split("-");
      jugador = jugadorAux[1];
    }
    return refJugadores.orderByChild('nombreCompleto').equalTo(`${jugador}`).once('value').then((snapshot) => {
      var aux = snapshot.val();
      console.log(aux);
      if (aux == null) {
        return refEquipos.once('value').then((snapshot) => {
          let existeEquipo = snapshot.child(`${equipo}`).exists();
          if (existeEquipo) {
            let idEquipo = snapshot.child(`${equipo}`).val().idAPI;
            var options = {
              method: 'GET',
              url: 'https://v3.football.api-sports.io/players',
              params: { search: `${jugador}`, season: 2020, team: idEquipo },
              headers: {
                'x-rapidapi-host': 'v3.football.api-sports.io',
                'x-rapidapi-key': apiKey,
              }
            };
            return axios.request(options).then(function (response) {
              let results = response.data.results;
              console.log("ERRORS:" + results);
              if (results == 0) {
                console.log("HAY ERRORES");
                agent.add("Vaya, parece que ese jugador no existe o no soy capaz de encontrarlo. Por favor, asegúrate de que estás escribiendo el nombre correctamente y evita las tildes.");
                agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
              } else {
                console.log("NO HAY ERRORES");
                let respuesta = response.data.response[0];
                let nombreCompleto = respuesta.player.name;
                let idAPI = respuesta.player.id;
                let nombre = respuesta.player.firstname;
                let apellidos = respuesta.player.lastname;
                let edad = respuesta.player.age;
                let país = respuesta.player.nationality;
                let altura = respuesta.player.height;
                let peso = respuesta.player.weight;
                let foto = respuesta.player.photo;
                let estadísticas = respuesta.statistics[0];
                let posicion = estadísticas.games.position;
                let equipo = estadísticas.team.name;
                let idEquipoAPI = estadísticas.team.id;
                //let liga = estadísticas.league.name;
                let idLigaAPI = estadísticas.league.id;
                //let liga = estadísticas.league.name;
                let partidosTotales = estadísticas.games.appearences;
                let partidosTitular = estadísticas.games.lineups;
                let minutos = estadísticas.games.minutes;
                let vecesSustituido = estadísticas.substitutes.out;
                let vecesDesdeBanquillo = estadísticas.substitutes.in;
                let vecesQuedoEnBanquillo = estadísticas.substitutes.bench;
                let tirosTotales = estadísticas.shots.total;
                let tirosPuerta = estadísticas.shots.on;
                if (tirosPuerta == null) {
                  tirosPuerta = 0;
                }
                let goles = estadísticas.goals.total;
                let golesRecibidos = estadísticas.goals.conceded;
                let asistencias = estadísticas.goals.assists;
                if (asistencias == null) {
                  asistencias = 0;
                }
                let paradas = estadísticas.goals.saves;
                let pasesTotales = estadísticas.passes.total;
                let pasesClave = estadísticas.passes.key;
                let efectividadPases = estadísticas.passes.accuracy;
                let entradas = estadísticas.tackles.total;
                let bloqueos = estadísticas.tackles.blocks;
                if (bloqueos == null) {
                  bloqueos = 0;
                }
                let robos = estadísticas.tackles.interceptions;
                let duelosTotales = estadísticas.duels.total;
                let duelosGanados = estadísticas.duels.won;
                let regatesTotales = estadísticas.dribbles.attempts;
                if (regatesTotales == null) {
                  regatesTotales = 0;
                }
                let regatesExitosos = estadísticas.dribbles.success;
                if (regatesExitosos == null) {
                  regatesExitosos = 0;
                }
                let partidos1Amarilla = estadísticas.cards.yellow;
                let partidos2Amarillas = estadísticas.cards.yellowred;
                let partidosRoja = estadísticas.cards.red;
                let penaltisRecibidos = estadísticas.penalty.won;
                if (penaltisRecibidos == null) {
                  penaltisRecibidos = 0;
                }
                let penaltisCometidos = estadísticas.penalty.commited;
                if (penaltisCometidos == null) {
                  penaltisCometidos = 0;
                }
                let penaltisAnotados = estadísticas.penalty.scored;
                let penaltisFallados = estadísticas.penalty.missed;
                let penaltisParados = estadísticas.penalty.saved;
                let fechaHoyTiempo = new Date();
                let fechaHoy = fechaHoyTiempo.getDate() + '/' + (fechaHoyTiempo.getMonth() + 1) + '/' + fechaHoyTiempo.getFullYear();
                console.log("DATA:" + JSON.stringify(respuesta));
                return translate(país, { from: "en", to: "es", engine: "google", key: translateKey }).then(text => {
                  país = text;
                  agent.add(new Card({ title: `Nombre: ${nombre}`, imageUrl: foto, text: `Apellido/s: ${apellidos}\nEdad: ${edad}\nPaís: ${país}\nEquipo: ${equipo}\nAltura: ${altura}\nPeso: ${peso}` }));
                  agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
                  return refJugadores.once('value').then((snapshot) => {
                    if (snapshot.child(`${idAPI}`).exists()) {
                      console.log("No se añade a BD.");
                    } else {
                      refJugadores.child(`${idAPI}`).set({
                        nombreCompleto: nombreCompleto,
                        nombre: nombre,
                        apellidos: apellidos,
                        edad: edad,
                        país: país,
                        altura: altura,
                        peso: peso,
                        foto: foto,
                        equipo: equipo,
                        idEquipoAPI: idEquipoAPI,
                        //liga: liga,
                        idLigaAPI: idLigaAPI

                      }).then(checkLigaEstadisticas(idAPI, partidosTotales, partidosTitular, minutos, vecesSustituido, vecesDesdeBanquillo, vecesQuedoEnBanquillo, tirosTotales, tirosPuerta, goles, golesRecibidos, asistencias, paradas, pasesTotales, pasesClave, efectividadPases, entradas, bloqueos, robos, duelosTotales, duelosGanados, regatesTotales, regatesExitosos, partidos1Amarilla, partidos2Amarillas, partidosRoja, penaltisRecibidos, penaltisCometidos, penaltisAnotados, penaltisFallados, penaltisParados, fechaHoy, posicion, idLigaAPI));
                    }
                  });
                });
              }
            }).catch(function (error) {
              console.error(error);
            });
          } else {
            var options = {
              method: 'GET',
              url: 'https://v3.football.api-sports.io/teams',
              params: { search: `${equipo}` },
              headers: {
                'x-rapidapi-host': 'v3.football.api-sports.io',
                'x-rapidapi-key': apiKey,
              }
            };
            return axios.request(options).then(function (response) {
              let errors = response.data.results;
              console.log("ERRORS:" + errors);
              if (errors == 0) {
                console.log("HAY ERRORES");
                agent.add("Vaya, parece que ese equipo no existe o no soy capaz de encontrarlo. Por favor, asegúrate de que estás escribiendo el nombre correctamente y evita escribir cosas como FC o Balompié. Puedes acudir a la clasificación de su liga para ver su nombre.");
                agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
              } else {
                console.log("NO HAY ERRORES");
                let respuesta = response.data.response[0];
                let nombreEquipo = respuesta.team.name;
                let idAPI = respuesta.team.id;
                let escudo = respuesta.team.logo;
                let añofundación = respuesta.team.founded;
                let pais = respuesta.team.country;
                let ciudad = respuesta.venue.city;
                let direccion = respuesta.venue.address;
                let estadio = respuesta.venue.name;
                let capacidadestadio = respuesta.venue.capacity;
                return translate(pais, { from: "en", to: "es", engine: "libre" }).then(text => {
                  pais = text;
                  agent.setContext({ "name": "Home", "lifespan": 1 });
                  agent.setFollowupEvent({ "name": "BuscarJugador", "parameters": { "nickname": nickname, "equipo": nombreEquipo, "jugador": jugador } });
                  return refEquipos.once('value').then((snapshot) => {
                    if (snapshot.child(`${nombreEquipo}`).exists()) {
                      console.log("No se añade a BD.");
                    } else {
                      refEquipos.child(`${nombreEquipo}`).set({
                        escudo: escudo,
                        ciudad: ciudad,
                        idAPI: idAPI,
                        añofundación: añofundación,
                        país: pais,
                        dirección: direccion,
                        estadio: estadio,
                        capacidadestadio: capacidadestadio,
                      });
                    }
                  });
                });
              }

            });
          }

        });
      } else {
        return snapshot.forEach((childSnapshot) => {
          let datos = childSnapshot.val();
          let nombreCompleto = datos.nombreCompleto;
          let nombre = datos.nombre;
          let apellidos = datos.apellidos;
          let edad = datos.edad;
          let país = datos.país;
          let equipo = datos.equipo;
          let altura = datos.altura;
          let peso = datos.peso;
          let foto = datos.foto;
          let idEquipoAPI = datos.idEquipoAPI;
          let idAPI = childSnapshot.key;
          let idLigaAPI = datos.idLigaAPI;
          agent.add(new Card({ title: `Nombre: ${nombre}`, imageUrl: foto, text: `Apellido/s: ${apellidos}\nEdad: ${edad}\nPaís: ${país}\nEquipo: ${equipo}\nAltura: ${altura}\nPeso: ${peso}` }));
          agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
        });
      }
    });
  }



  function handleBuscarEstadisticasJugador(agent) {
    var nickname = agent.parameters.nickname;
    var jugador = agent.parameters.jugador;
    var competicion = agent.parameters.competicion;
    if (jugador.includes("-")) {
      let jugadorAux = jugador.split("-");
      jugador = jugadorAux[1];
    }
    return refCompeticiones.child(`${competicion}`).once('value').then((snapshot) => {
      if (snapshot.exists()) {
        console.log(JSON.stringify(snapshot.val()));
        var idLiga = snapshot.val().idAPI;
        return refJugadores.orderByChild('nombreCompleto').equalTo(`${jugador}`).once('value').then((snapshot) => {
          var aux = snapshot.val();
          console.log(aux);
          if (aux == null) {

            var options = {
              method: 'GET',
              url: 'https://v3.football.api-sports.io/players',
              params: { search: `${jugador}`, season: 2020, league: idLiga },
              headers: {
                'x-rapidapi-host': 'v3.football.api-sports.io',
                'x-rapidapi-key': apiKey,
              }
            };
            return axios.request(options).then(function (response) {
              let results = response.data.results;
              console.log("ERRORS:" + results);
              if (results == 0) {
                console.log("HAY ERRORES");
                agent.add("Vaya, parece que ese jugador no existe o no soy capaz de encontrarlo. Por favor, asegúrate de que estás escribiendo el nombre correctamente y evita las tildes.");
                agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
              } else {
                console.log("NO HAY ERRORES");
                let respuesta = response.data.response[0];
                let nombreCompleto = respuesta.player.name;
                let idAPI = respuesta.player.id;
                let nombre = respuesta.player.firstname;
                let apellidos = respuesta.player.lastname;
                let edad = respuesta.player.age;
                let país = respuesta.player.nationality;
                let altura = respuesta.player.height;
                let peso = respuesta.player.weight;
                let foto = respuesta.player.photo;
                let estadísticas = respuesta.statistics[0];
                let posicion = estadísticas.games.position;
                let equipo = estadísticas.team.name;
                let idEquipoAPI = estadísticas.team.id;
                //let liga = estadísticas.league.name;
                let idLigaAPI = estadísticas.league.id;
                let partidosTotales = estadísticas.games.appearences;
                let partidosTitular = estadísticas.games.lineups;
                let minutos = estadísticas.games.minutes;
                let vecesSustituido = estadísticas.substitutes.out;
                let vecesDesdeBanquillo = estadísticas.substitutes.in;
                let vecesQuedoEnBanquillo = estadísticas.substitutes.bench;
                let tirosTotales = estadísticas.shots.total;
                let tirosPuerta = estadísticas.shots.on;
                if (tirosPuerta == null) {
                  tirosPuerta = 0;
                }
                let goles = estadísticas.goals.total;
                let golesRecibidos = estadísticas.goals.conceded;
                let asistencias = estadísticas.goals.assists;
                if (asistencias == null) {
                  asistencias = 0;
                }
                let paradas = estadísticas.goals.saves;
                let pasesTotales = estadísticas.passes.total;
                let pasesClave = estadísticas.passes.key;
                let efectividadPases = estadísticas.passes.accuracy;
                let entradas = estadísticas.tackles.total;
                let bloqueos = estadísticas.tackles.blocks;
                if (bloqueos == null) {
                  bloqueos = 0;
                }
                let robos = estadísticas.tackles.interceptions;
                let duelosTotales = estadísticas.duels.total;
                let duelosGanados = estadísticas.duels.won;
                let regatesTotales = estadísticas.dribbles.attempts;
                if (regatesTotales == null) {
                  regatesTotales = 0;
                }
                let regatesExitosos = estadísticas.dribbles.success;
                if (regatesExitosos == null) {
                  regatesExitosos = 0;
                }
                let partidos1Amarilla = estadísticas.cards.yellow;
                let partidos2Amarillas = estadísticas.cards.yellowred;
                let partidosRoja = estadísticas.cards.red;
                let penaltisRecibidos = estadísticas.penalty.won;
                if (penaltisRecibidos == null) {
                  penaltisRecibidos = 0;
                }
                let penaltisCometidos = estadísticas.penalty.commited;
                if (penaltisCometidos == null) {
                  penaltisCometidos = 0;
                }
                let penaltisAnotados = estadísticas.penalty.scored;
                let penaltisFallados = estadísticas.penalty.missed;
                let penaltisParados = estadísticas.penalty.saved;
                let fechaHoyTiempo = new Date();
                let fechaHoy = fechaHoyTiempo.getDate() + '/' + (fechaHoyTiempo.getMonth() + 1) + '/' + fechaHoyTiempo.getFullYear();
                //console.log("DATA:" + JSON.stringify(respuesta));
                if (posicion == "Goalkeeper") {
                  agent.add(new Card({ title: `Estadísticas de ${nombreCompleto}`, text: `Goles recibidos: ${golesRecibidos}\nParadas: ${paradas}\nMinutos: ${minutos}\nPartidos: ${partidosTotales}\nPenaltis marcados: ${penaltisAnotados}\nPenaltis fallados: ${penaltisFallados}\nPenaltis parados: ${penaltisParados}\nPorcentaje de acierto en pases: ${efectividadPases}%\nDuelos totales: ${duelosTotales}\nDuelos ganados: ${duelosGanados}`, buttonText: "Ver más", buttonUrl: "Ver más estadísticas del jugador" }));
                  agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname, "idJugador": idAPI, "nombreCompleto": nombreCompleto } });
                } else {
                  agent.add(new Card({ title: `Estadísticas de ${nombreCompleto}`, text: `Goles: ${goles}\nAsistencias: ${asistencias}\nPases clave: ${pasesClave}\nMinutos: ${minutos}\nPartidos: ${partidosTotales}\nTiros: ${tirosTotales}\nTiros a puerta: ${tirosPuerta}\nRegates intentados: ${regatesTotales}\nRegates exitosos: ${regatesExitosos}\nPenaltis marcados: ${penaltisAnotados}\nPenaltis fallados: ${penaltisFallados}\nEntradas: ${entradas}\nRecuperaciones: ${robos}\nPorcentaje de acierto en pases: ${efectividadPases}%\nDuelos totales: ${duelosTotales}\nDuelos ganados: ${duelosGanados}`, buttonText: "Ver más", buttonUrl: "Ver más estadísticas del jugador" }));
                  agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname, "idJugador": idAPI, "nombreCompleto": nombreCompleto } });
                }

                return refJugadores.once('value').then((snapshot) => {
                  if (snapshot.child(`${idAPI}`).exists()) {
                    console.log("No se añade a BD.");
                    if ((snapshot.child(`${idAPI}`).child("estadísticas").exists() && snapshot.child(`${idAPI}`).child("estadísticas").val().fecha != fechaHoy) || !snapshot.child(`${idAPI}`).child("estadísticas").exists()) {
                      return guardarEstadisticas(idAPI, partidosTotales, partidosTitular, minutos, vecesSustituido, vecesDesdeBanquillo, vecesQuedoEnBanquillo, tirosTotales, tirosPuerta, goles, golesRecibidos, asistencias, paradas, pasesTotales, pasesClave, efectividadPases, entradas, bloqueos, robos, duelosTotales, duelosGanados, regatesTotales, regatesExitosos, partidos1Amarilla, partidos2Amarillas, partidosRoja, penaltisRecibidos, penaltisCometidos, penaltisAnotados, penaltisFallados, penaltisParados, fechaHoy, posicion);
                    } else {
                      console.log("No se añaden/actualizan estadísticas a BD.");
                    }

                  } else {
                    return translate(país, { from: "en", to: "es", engine: "google", key: translateKey }).then(text => {
                      país = text;
                      refJugadores.child(`${idAPI}`).set({
                        nombreCompleto: nombreCompleto,
                        nombre: nombre,
                        apellidos: apellidos,
                        edad: edad,
                        país: país,
                        altura: altura,
                        peso: peso,
                        foto: foto,
                        equipo: equipo,
                        idEquipoAPI: idEquipoAPI,
                        //liga: liga,
                        idLigaAPI: idLigaAPI
                      }).then(guardarEstadisticas(idAPI, partidosTotales, partidosTitular, minutos, vecesSustituido, vecesDesdeBanquillo, vecesQuedoEnBanquillo, tirosTotales, tirosPuerta, goles, golesRecibidos, asistencias, paradas, pasesTotales, pasesClave, efectividadPases, entradas, bloqueos, robos, duelosTotales, duelosGanados, regatesTotales, regatesExitosos, partidos1Amarilla, partidos2Amarillas, partidosRoja, penaltisRecibidos, penaltisCometidos, penaltisAnotados, penaltisFallados, penaltisParados, fechaHoy, posicion));
                    });
                  }
                });

              }
            }).catch(function (error) {
              console.error(error);
            });
          } else {
            console.log("SE AÑADE JUGADOR A BD");
            let fechaHoyTiempo = new Date();
            let fechaHoy = fechaHoyTiempo.getDate() + '/' + (fechaHoyTiempo.getMonth() + 1) + '/' + fechaHoyTiempo.getFullYear();
            return snapshot.forEach((childSnapshot) => {
              let datos = childSnapshot.child("estadísticas").val();
              let infoJugador = childSnapshot.val();
              let nombreCompleto = infoJugador.nombreCompleto;
              let idLiga = infoJugador.idLigaAPI;
              let idJugador = childSnapshot.key;

              if (datos.fecha != fechaHoy) {
                agent.setContext({ "name": "Home", "lifespan": 1 });
                agent.setFollowupEvent({ "name": "ActualizarEstadisticasJugador", "parameters": { "nickname": nickname, "idLiga": idLiga, "idJugador": idJugador } });
                return refJugadores.child(idJugador).child("estadísticas").remove();
              } else {
                let posicion = datos.posicion;
                let partidosTotales = datos.partidosTotales;
                let partidosTitular = datos.partidosTitular;
                let minutos = datos.minutos;
                let vecesSustituido = datos.vecesSustituido;
                let vecesDesdeBanquillo = datos.vecesDesdeBanquillo;
                let vecesQuedoEnBanquillo = datos.vecesQuedoEnBanquillo;
                let tirosTotales = datos.tirosTotales;
                let tirosPuerta = datos.tirosPuerta;
                let goles = datos.goles;
                let golesRecibidos = datos.golesRecibidos;
                let asistencias = datos.asistencias;
                let paradas = datos.paradas;
                let pasesTotales = datos.pasesTotales;
                let pasesClave = datos.pasesClave;
                let efectividadPases = datos.efectividadPases;
                let entradas = datos.entradas;
                let bloqueos = datos.bloqueos;
                let robos = datos.robos;
                let duelosTotales = datos.duelosTotales;
                let duelosGanados = datos.duelosGanados;
                let regatesTotales = datos.regatesTotales;
                let regatesExitosos = datos.regatesExitosos;
                let partidos1Amarilla = datos.partidos1Amarilla;
                let partidos2Amarillas = datos.partidos2Amarillas;
                let partidosRoja = datos.partidosRoja;
                let penaltisRecibidos = datos.penaltisRecibidos;
                let penaltisCometidos = datos.penaltisCometidos;
                let penaltisAnotados = datos.penaltisAnotados;
                let penaltisFallados = datos.penaltisFallados;
                let penaltisParados = datos.penaltisParados;

                if (posicion == "Goalkeeper") {
                  agent.add(new Card({ title: `Estadísticas de ${nombreCompleto}`, text: `Goles recibidos: ${golesRecibidos}\nParadas: ${paradas}\nMinutos: ${minutos}\nPartidos: ${partidosTotales}\nPenaltis marcados: ${penaltisAnotados}\nPenaltis fallados: ${penaltisFallados}\nPenaltis parados: ${penaltisParados}\nPorcentaje de acierto en pases: ${efectividadPases}%\nDuelos totales: ${duelosTotales}\nDuelos ganados: ${duelosGanados}`, buttonText: "Ver más", buttonUrl: "Ver más estadísticas del jugador" }));
                  agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname, "idJugador": idJugador, "nombreCompleto": nombreCompleto } });
                } else {
                  agent.add(new Card({ title: `Estadísticas de ${nombreCompleto}`, text: `Goles: ${goles}\nAsistencias: ${asistencias}\nPases clave: ${pasesClave}\nMinutos: ${minutos}\nPartidos: ${partidosTotales}\nTiros: ${tirosTotales}\nTiros a puerta: ${tirosPuerta}\nRegates intentados: ${regatesTotales}\nRegates exitosos: ${regatesExitosos}\nPenaltis marcados: ${penaltisAnotados}\nPenaltis fallados: ${penaltisFallados}\nEntradas: ${entradas}\nRecuperaciones: ${robos}\nPorcentaje de acierto en pases: ${efectividadPases}%\nDuelos totales: ${duelosTotales}\nDuelos ganados: ${duelosGanados}`, buttonText: "Ver más", buttonUrl: "Ver más estadísticas del jugador" }));
                  agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname, "idJugador": idJugador, "nombreCompleto": nombreCompleto } });
                }
              }
            });
          }

        });
      } else {
        agent.add("Vaya, parece que esa liga no existe o no está disponible para la funcionalidad de estadísticas. Recuerda que de momento estoy capacitado para proporcionar información sobre las grandes ligas de Europa. Para recibir más información sobre esto escribe ayuda.");
        agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
      }
    });
  }
  function handleActualizarEstadisticasJugador(agent) {
    var nickname = agent.parameters.nickname;
    var idJugador = agent.parameters.idJugador;
    var idLiga = agent.parameters.idLiga;
    var options = {
      method: 'GET',
      url: 'https://v3.football.api-sports.io/players',
      params: { id: `${idJugador}`, season: 2020, league: idLiga },
      headers: {
        'x-rapidapi-host': 'v3.football.api-sports.io',
        'x-rapidapi-key': apiKey,
      }
    };
    return axios.request(options).then(function (response) {
      let results = response.data.results;
      console.log("ERRORS:" + results);
      if (results == 0) {
        console.log("HAY ERRORES");
        agent.add("Vaya, parece que ese jugador no existe o no soy capaz de encontrarlo. Por favor, asegúrate de que estás escribiendo el nombre correctamente y evita las tildes.");
        agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
      } else {
        console.log("NO HAY ERRORES");
        let respuesta = response.data.response[0];
        let nombreCompleto = respuesta.player.name;
        let idAPI = respuesta.player.id;
        let estadísticas = respuesta.statistics[0];
        let posicion = estadísticas.games.position;
        //let liga = estadísticas.league.name;
        let partidosTotales = estadísticas.games.appearences;
        let partidosTitular = estadísticas.games.lineups;
        let minutos = estadísticas.games.minutes;
        let vecesSustituido = estadísticas.substitutes.out;
        let vecesDesdeBanquillo = estadísticas.substitutes.in;
        let vecesQuedoEnBanquillo = estadísticas.substitutes.bench;
        let tirosTotales = estadísticas.shots.total;
        let tirosPuerta = estadísticas.shots.on;
        if (tirosPuerta == undefined) {
          tirosPuerta = 0;
        }
        let goles = estadísticas.goals.total;
        let golesRecibidos = estadísticas.goals.conceded;
        let asistencias = estadísticas.goals.assists;
        if (asistencias == undefined) {
          asistencias = 0;
        }
        let paradas = estadísticas.goals.saves;
        let pasesTotales = estadísticas.passes.total;
        let pasesClave = estadísticas.passes.key;
        let efectividadPases = estadísticas.passes.accuracy;
        let entradas = estadísticas.tackles.total;
        let bloqueos = estadísticas.tackles.blocks;
        if (bloqueos == undefined) {
          bloqueos = 0;
        }
        let robos = estadísticas.tackles.interceptions;
        let duelosTotales = estadísticas.duels.total;
        let duelosGanados = estadísticas.duels.won;
        let regatesTotales = estadísticas.dribbles.attempts;
        if (regatesTotales == undefined) {
          regatesTotales = 0;
        }
        let regatesExitosos = estadísticas.dribbles.success;
        if (regatesExitosos == undefined) {
          regatesExitosos = 0;
        }
        let partidos1Amarilla = estadísticas.cards.yellow;
        let partidos2Amarillas = estadísticas.cards.yellowred;
        let partidosRoja = estadísticas.cards.red;
        let penaltisRecibidos = estadísticas.penalty.won;
        if (penaltisRecibidos == undefined) {
          penaltisRecibidos = 0;
        }
        let penaltisCometidos = estadísticas.penalty.commited;
        if (penaltisCometidos == undefined) {
          penaltisCometidos = 0;
        }
        let penaltisAnotados = estadísticas.penalty.scored;
        let penaltisFallados = estadísticas.penalty.missed;
        let penaltisParados = estadísticas.penalty.saved;
        let fechaHoyTiempo = new Date();
        let fechaHoy = fechaHoyTiempo.getDate() + '/' + (fechaHoyTiempo.getMonth() + 1) + '/' + fechaHoyTiempo.getFullYear();
        //console.log("DATA:" + JSON.stringify(respuesta));
        if (posicion == "Goalkeeper") {
          agent.add(new Card({ title: `Estadísticas de ${nombreCompleto}`, text: `Goles recibidos: ${golesRecibidos}\nParadas: ${paradas}\nMinutos: ${minutos}\nPartidos: ${partidosTotales}\nPenaltis marcados: ${penaltisAnotados}\nPenaltis fallados: ${penaltisFallados}\nPenaltis parados: ${penaltisParados}\nPorcentaje de acierto en pases: ${efectividadPases}%\nDuelos totales: ${duelosTotales}\nDuelos ganados: ${duelosGanados}`, buttonText: "Ver más", buttonUrl: "Ver más estadísticas del jugador" }));
          agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname, "idJugador": idAPI } });
        } else {
          agent.add(new Card({ title: `Estadísticas de ${nombreCompleto}`, text: `Goles: ${goles}\nAsistencias: ${asistencias}\nPases clave: ${pasesClave}\nMinutos: ${minutos}\nPartidos: ${partidosTotales}\nTiros: ${tirosTotales}\nTiros a puerta: ${tirosPuerta}\nRegates intentados: ${regatesTotales}\nRegates exitosos: ${regatesExitosos}\nPenaltis marcados: ${penaltisAnotados}\nPenaltis fallados: ${penaltisFallados}\nEntradas: ${entradas}\nRecuperaciones: ${robos}\nPorcentaje de acierto en pases: ${efectividadPases}%\nDuelos totales: ${duelosTotales}\nDuelos ganados: ${duelosGanados}`, buttonText: "Ver más", buttonUrl: "Ver más estadísticas del jugador" }));
          agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname, "idJugador": idAPI } });
        }
        return guardarEstadisticas(idAPI, partidosTotales, partidosTitular, minutos, vecesSustituido, vecesDesdeBanquillo, vecesQuedoEnBanquillo, tirosTotales, tirosPuerta, goles, golesRecibidos, asistencias, paradas, pasesTotales, pasesClave, efectividadPases, entradas, bloqueos, robos, duelosTotales, duelosGanados, regatesTotales, regatesExitosos, partidos1Amarilla, partidos2Amarillas, partidosRoja, penaltisRecibidos, penaltisCometidos, penaltisAnotados, penaltisFallados, penaltisParados, fechaHoy, posicion);
      }
    });
  }
  function handleBuscarAmpliarJugador(agent) {
    console.log("LLEGA A AMPLIAR");
    var nickname = agent.parameters.nickname;
    var idJugador = agent.parameters.idJugador;
    var nombreCompleto = agent.parameters.nombreCompleto;
    return refJugadores.child(idJugador).child("estadísticas").once('value').then((snapshot) => {
      var datos = snapshot.val();
      let partidosTitular = datos.partidosTitular;
      let vecesSustituido = datos.vecesSustituido;
      let vecesDesdeBanquillo = datos.vecesDesdeBanquillo;
      let vecesQuedoEnBanquillo = datos.vecesQuedoEnBanquillo;
      let pasesTotales = datos.pasesTotales;
      let bloqueos = datos.bloqueos;
      let partidos1Amarilla = datos.partidos1Amarilla;
      let partidos2Amarillas = datos.partidos2Amarillas;
      let partidosRoja = datos.partidosRoja;
      let penaltisRecibidos = datos.penaltisRecibidos;
      let penaltisCometidos = datos.penaltisCometidos;
      let posicion = datos.posicion;
      if (posicion == "Goalkeeper") {
        agent.add(new Card({ title: `Estadísticas de ${nombreCompleto}`, text: `Partidos como titular: ${partidosTitular}\nPartidos que fue sustituido: ${vecesSustituido}\nPartidos que salió desde el banquillo: ${vecesDesdeBanquillo}\nPartidos que se quedó en el banquillo: ${vecesQuedoEnBanquillo}\nPases totales: ${pasesTotales}\nPartidos donde recibió 1 amarilla: ${partidos1Amarilla}\nPartidos donde fue expulsado por doble amarilla: ${partidos2Amarillas}\nPartidos donde fue expulsado por tarjeta roja: ${partidosRoja}\nPenaltis cometidos: ${penaltisCometidos}` }));
        agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
      } else {
        agent.add(new Card({ title: `Estadísticas de ${nombreCompleto}`, text: `Partidos como titular: ${partidosTitular}\nPartidos que fue sustituido: ${vecesSustituido}\nPartidos que salió desde el banquillo: ${vecesDesdeBanquillo}\nPartidos que se quedó en el banquillo: ${vecesQuedoEnBanquillo}\nPases totales: ${pasesTotales}\nBloqueos: ${bloqueos}\nPartidos donde recibió 1 amarilla: ${partidos1Amarilla}\nPartidos donde fue expulsado por doble amarilla: ${partidos2Amarillas}\nPartidos donde fue expulsado por tarjeta roja: ${partidosRoja}\nPenaltis recibidos: ${penaltisRecibidos}\nPenaltis cometidos: ${penaltisCometidos}` }));
        agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
      }
    });
  }

  //=========================================================================================================================================================================
  //BUSCAR ESTADÍSTICAS DE EQUIPOS
  //=========================================================================================================================================================================

  function guardarEstadisticasEquipo(nombreEquipo, partidosJugados, victorias, derrotas, empates, golesMarcados, golesRecibidos, difGoles, forma, posicionClasificacion, puntos, consecuenciaClasificacion, partidosJugadosLocal, victoriasLocal, empatesLocal, derrotasLocal, golesMarcadosLocal, golesRecibidosLocal, partidosJugadosVisitante, victoriasVisitante, empatesVisitante, derrotasVisitante, golesMarcadosVisitante, golesRecibidosVisitante, fechaHoy) {
    refEquipos.child(nombreEquipo).child("estadísticas").set({
      partidosJugados: partidosJugados,
      victorias: victorias,
      derrotas: derrotas,
      empates: empates,
      golesMarcados: golesMarcados,
      golesRecibidos: golesRecibidos,
      difGoles: difGoles,
      forma: forma,
      posicionClasificacion: posicionClasificacion,
      puntos: puntos,
      consecuenciaClasificacion: consecuenciaClasificacion,
      partidosJugadosLocal: partidosJugadosLocal,
      victoriasLocal: victoriasLocal,
      empatesLocal: empatesLocal,
      derrotasLocal: derrotasLocal,
      golesMarcadosLocal: golesMarcadosLocal,
      golesRecibidosLocal: golesRecibidosLocal,
      partidosJugadosVisitante: partidosJugadosVisitante,
      victoriasVisitante: victoriasVisitante,
      empatesVisitante: empatesVisitante,
      derrotasVisitante: derrotasVisitante,
      golesMarcadosVisitante: golesMarcadosVisitante,
      golesRecibidosVisitante: golesRecibidosVisitante,
      fecha: fechaHoy
    });
  }

  function actualizarEstadisticasEquipo(idEquipo, idLiga, nickname) {
    var options = {
      method: 'GET',
      url: 'https://v3.football.api-sports.io/standings',
      params: { team: `${idEquipo}`, season: 2020, league: idLiga },
      headers: {
        'x-rapidapi-host': 'v3.football.api-sports.io',
        'x-rapidapi-key': apiKey,
      }
    };
    return axios.request(options).then(function (response) {
      let results = response.data.results;
      console.log("ERRORS:" + results);
      if (results == 0) {
        console.log("HAY ERRORES");
        agent.add("Vaya, parece que ese equipo no existe o no soy capaz de encontrarlo. Por favor, asegúrate de que estás escribiendo el nombre correctamente y evita las tildes y cosas como el FC o Balompié.");
        agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
      } else {
        console.log("NO HAY ERRORES");
        let respuesta = response.data.response[0].league.standings[0][0];
        let nombreEquipo = respuesta.team.name;
        let partidosJugados = respuesta.all.played;
        let victorias = respuesta.all.win;
        let derrotas = respuesta.all.lose;
        let empates = respuesta.all.draw;
        let golesMarcados = respuesta.all.goals.for;
        let golesRecibidos = respuesta.all.goals.against;
        let difGoles = respuesta.goalsDiff;
        let forma = respuesta.form;
        forma = forma.replace(/W/g, 'V');
        forma = forma.replace(/D/g, 'E');
        forma = forma.replace(/L/g, 'D');
        let posicionClasificacion = respuesta.rank;
        let puntos = respuesta.points;
        let consecuenciaClasificacion = respuesta.description;
        let partidosJugadosLocal = respuesta.home.played;
        let victoriasLocal = respuesta.home.win;
        let empatesLocal = respuesta.home.draw;
        let derrotasLocal = respuesta.home.lose;
        let golesMarcadosLocal = respuesta.home.goals.for;
        let golesRecibidosLocal = respuesta.home.goals.against;
        let partidosJugadosVisitante = respuesta.away.played;
        let victoriasVisitante = respuesta.away.win;
        let empatesVisitante = respuesta.away.draw;
        let derrotasVisitante = respuesta.away.lose;
        let golesMarcadosVisitante = respuesta.away.goals.for;
        let golesRecibidosVisitante = respuesta.away.goals.against;
        console.log("NOMBRE:" + nombreEquipo);
        let fechaHoyTiempo = new Date();
        let fechaHoy = fechaHoyTiempo.getDate() + '/' + (fechaHoyTiempo.getMonth() + 1) + '/' + fechaHoyTiempo.getFullYear();
        if (consecuenciaClasificacion == null) {
          consecuenciaClasificacion = "Ninguna";
          agent.add(new Card({ title: `Estadísticas del ${nombreEquipo}`, text: `Partidos jugados en total: ${partidosJugados}\nVictorias: ${victorias}\nDerrotas: ${derrotas}\nEmpates: ${empates}\nGoles a favor: ${golesMarcados}\nGoles en contra: ${golesRecibidos}\nDiferencia de goles: ${difGoles}\nForma: ${forma}\nPosición en la clasificación: ${posicionClasificacion}\nPuntos: ${puntos}\nConsecuencia de la posición en la clasificación: ${consecuenciaClasificacion}`, buttonText: "Ver más", buttonUrl: "Ver más estadísticas del equipo" }));
          agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname, "idEquipo": idEquipo, "nombreEquipo": nombreEquipo } });
          guardarEstadisticasEquipo(nombreEquipo, partidosJugados, victorias, derrotas, empates, golesMarcados, golesRecibidos, difGoles, forma, posicionClasificacion, puntos, consecuenciaClasificacion, partidosJugadosLocal, victoriasLocal, empatesLocal, derrotasLocal, golesMarcadosLocal, golesRecibidosLocal, partidosJugadosVisitante, victoriasVisitante, empatesVisitante, derrotasVisitante, golesMarcadosVisitante, golesRecibidosVisitante, fechaHoy);
        } else {
          return translate(consecuenciaClasificacion, { from: "en", to: "es", engine: "google", key: translateKey }).then(text => {
            consecuenciaClasificacion = text;
            agent.add(new Card({ title: `Estadísticas del ${nombreEquipo}`, text: `Partidos jugados en total: ${partidosJugados}\nVictorias: ${victorias}\nDerrotas: ${derrotas}\nEmpates: ${empates}\nGoles a favor: ${golesMarcados}\nGoles en contra: ${golesRecibidos}\nDiferencia de goles: ${difGoles}\nForma: ${forma}\nPosición en la clasificación: ${posicionClasificacion}\nPuntos: ${puntos}\nConsecuencia de la posición en la clasificación: ${consecuenciaClasificacion}`, buttonText: "Ver más", buttonUrl: "Ver más estadísticas del equipo" }));
            agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname, "idEquipo": idEquipo, "nombreEquipo": nombreEquipo } });
            guardarEstadisticasEquipo(nombreEquipo, partidosJugados, victorias, derrotas, empates, golesMarcados, golesRecibidos, difGoles, forma, posicionClasificacion, puntos, consecuenciaClasificacion, partidosJugadosLocal, victoriasLocal, empatesLocal, derrotasLocal, golesMarcadosLocal, golesRecibidosLocal, partidosJugadosVisitante, victoriasVisitante, empatesVisitante, derrotasVisitante, golesMarcadosVisitante, golesRecibidosVisitante, fechaHoy);
          });
        }
      }
    }).catch(function (error) {
      console.error(error);
    });
  }

  function buscarEquipo(equipo, nickname, competicion) {
    var options = {
      method: 'GET',
      url: 'https://v3.football.api-sports.io/teams',
      params: { search: `${equipo}` },
      headers: {
        'x-rapidapi-host': 'v3.football.api-sports.io',
        'x-rapidapi-key': apiKey,
      }
    };
    return axios.request(options).then(function (response) {
      let errors = response.data.results;
      console.log("ERRORS:" + errors);
      if (errors == 0) {
        console.log("HAY ERRORES");
        agent.add("Vaya, parece que ese equipo no existe o no soy capaz de encontrarlo. Por favor, asegúrate de que estás escribiendo el nombre correctamente y evita escribir cosas como FC o Balompié. Puedes acudir a la clasificación de su liga para ver su nombre.");
        agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
      } else {
        console.log("NO HAY ERRORES");
        let respuesta = response.data.response[0];
        let nombreEquipo = respuesta.team.name;
        let idAPI = respuesta.team.id;
        let escudo = respuesta.team.logo;
        let añofundación = respuesta.team.founded;
        let pais = respuesta.team.country;
        let ciudad = respuesta.venue.city;
        let direccion = respuesta.venue.address;
        let estadio = respuesta.venue.name;
        let capacidadestadio = respuesta.venue.capacity;
        return translate(pais, { from: "en", to: "es", engine: "google", key: translateKey }).then(text => {
          pais = text;
          agent.setContext({ "name": "Home", "lifespan": 1 });
          agent.setFollowupEvent({ "name": "BuscarJugadorEstadisticasEquipo", "parameters": { "nickname": nickname, "equipo": nombreEquipo, "competicion": competicion } });
          return refEquipos.once('value').then((snapshot) => {
            if (snapshot.child(`${nombreEquipo}`).exists()) {
              console.log("No se añade a BD.");
            } else {
              refEquipos.child(`${nombreEquipo}`).set({
                escudo: escudo,
                ciudad: ciudad,
                idAPI: idAPI,
                añofundación: añofundación,
                país: pais,
                dirección: direccion,
                estadio: estadio,
                capacidadestadio: capacidadestadio,
              });
            }
          });
        });
      }

    });
  }

  function handleAmpliarEstadisticasEquipo() {
    const nickname = agent.parameters.nickname;
    const nombreEquipo = agent.parameters.nombreEquipo;
    return refEquipos.child(`${nombreEquipo}`).child("estadísticas").once('value').then((snapshot) => {
      let datos = snapshot.val();
      let partidosJugadosLocal = datos.partidosJugadosLocal;
      let victoriasLocal = datos.victoriasLocal;
      let empatesLocal = datos.empatesLocal;
      let derrotasLocal = datos.derrotasLocal;
      let golesMarcadosLocal = datos.golesMarcadosLocal;
      let golesRecibidosLocal = datos.golesRecibidosLocal;
      let partidosJugadosVisitante = datos.partidosJugadosVisitante;
      let victoriasVisitante = datos.victoriasVisitante;
      let empatesVisitante = datos.empatesVisitante;
      let derrotasVisitante = datos.derrotasVisitante;
      let golesMarcadosVisitante = datos.golesMarcadosVisitante;
      let golesRecibidosVisitante = datos.golesRecibidosVisitante;
      agent.add(new Card({ title: `Estadísticas del ${nombreEquipo}`, text: `Partidos jugados como local: ${partidosJugadosLocal}\nVictorias como local: ${victoriasLocal}\nDerrotas como local: ${derrotasLocal}\nEmpates como local: ${empatesLocal}\nGoles marcados como local: ${golesMarcadosLocal}\nGoles recibidos como local: ${golesRecibidosLocal}\nPartidos jugados como visitante: ${partidosJugadosVisitante}\nVictorias como visitante: ${victoriasVisitante}\nDerrotas como visitante: ${derrotasVisitante}\nEmpates como visitante: ${empatesVisitante}\nGoles marcados como visitante: ${golesMarcadosVisitante}\nGoles recibidos como visitante: ${golesRecibidosVisitante}` }));
      agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
    });
  }
  function handleBuscarEstadisticasEquipoId(agent) {
    console.log("ESTADÍSTICAS EQUIPO ID");
    const nickname = agent.parameters.nickname;
    const nombreEquipo = agent.parameters.nombreEquipo;
    let refFavoritos = db.ref(`users/${nickname}/favoritos/equipos`);
    if (nombreEquipo == "") {
      agent.add("Vaya, parece que ese equipo no existe o no soy capaz de encontrarlo. Por favor, asegúrate de que estás escribiendo el nombre correctamente y evita escribir cosas como FC o Balompié. Puedes acudir a la clasificación de su liga para ver su nombre.");
      agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
    } else {
      return refFavoritos.child(nombreEquipo).once('value').then((snapshot) => {
        if(!snapshot.exists()){
          agent.add("Vaya, parece que ese equipo no existe o no soy capaz de encontrarlo. Por favor, asegúrate de que estás escribiendo el nombre correctamente y evita escribir cosas como FC o Balompié. Puedes acudir a la clasificación de su liga para ver su nombre.");
          agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
        }else{
          let idEquipo = snapshot.val().idEquipo;
        let nombreLiga = snapshot.val().nombreLiga;
        if (nombreLiga != null) {
          agent.setContext({ "name": "Home", "lifespan": 1 });
          agent.setFollowupEvent({ "name": "BuscarJugadorEstadisticasEquipo", "parameters": { "nickname": nickname, "equipo": nombreEquipo, "competicion": nombreLiga } });
        } else {
          var options = {
            method: 'GET',
            url: 'https://v3.football.api-sports.io/leagues',
            params: { season: 2020, team: idEquipo, type: "League" },
            headers: {
              'x-rapidapi-host': 'v3.football.api-sports.io',
              'x-rapidapi-key': apiKey,
            }
          };
          return axios.request(options).then(function (response) {
            let errors = response.data.results;
            console.log("ERRORS:" + errors);
            if (errors == 0) {
              console.log("HAY ERRORES");
              agent.add("Vaya, parece que ese equipo no existe o no soy capaz de encontrarlo. Por favor, asegúrate de que estás escribiendo el nombre correctamente y evita escribir cosas como FC o Balompié. Puedes acudir a la clasificación de su liga para ver su nombre.");
              agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
            } else {
              console.log("NO HAY ERRORES");
              let respuesta = response.data.response[0];
              nombreLiga = respuesta.league.name;
              agent.setContext({ "name": "Home", "lifespan": 1 });
              agent.setFollowupEvent({ "name": "BuscarJugadorEstadisticasEquipo", "parameters": { "nickname": nickname, "equipo": nombreEquipo, "competicion": nombreLiga } });
              refFavoritos.child(nombreEquipo).update({
                nombreLiga: nombreLiga
              });
            }
          });
        }
      }
      });
    }

  }
  function handleBuscarEstadisticasEquipo(agent) {
    console.log("ESTADÍSTICAS EQUIPO");
    var nickname = agent.parameters.nickname;
    var equipo = agent.parameters.equipo;
    var competicion = agent.parameters.competicion;
    return refCompeticiones.child(`${competicion}`).once('value').then((snapshot) => {
      if (snapshot.exists()) {
        console.log(JSON.stringify(snapshot.val()));
        var idLiga = snapshot.val().idAPI;
        return refEquipos.child(`${equipo}`).once('value').then((snapshot) => {
          if (snapshot.exists()) {
            let datos = snapshot.val();
            let idEquipo = datos.idAPI;
            let nombreEquipo = snapshot.key;
            return refEquipos.child(`${equipo}`).child("estadísticas").once('value').then((snapshot) => {
              if (snapshot.exists()) {
                let estadisticas = snapshot.val();
                let fechaHoyTiempo = new Date();
                let fechaHoy = fechaHoyTiempo.getDate() + '/' + (fechaHoyTiempo.getMonth() + 1) + '/' + fechaHoyTiempo.getFullYear();
                if (estadisticas.fecha != fechaHoy) {
                  return actualizarEstadisticasEquipo(idEquipo, idLiga, nickname);
                } else {
                  let partidosJugados = estadisticas.partidosJugados;
                  let victorias = estadisticas.victorias;
                  let derrotas = estadisticas.derrotas;
                  let empates = estadisticas.empates;
                  let golesMarcados = estadisticas.golesMarcados;
                  let golesRecibidos = estadisticas.golesRecibidos;
                  let difGoles = estadisticas.difGoles;
                  let forma = estadisticas.forma;
                  let posicionClasificacion = estadisticas.posicionClasificacion;
                  let puntos = estadisticas.puntos;
                  let consecuenciaClasificacion = estadisticas.consecuenciaClasificacion;
                  agent.add(new Card({ title: `Estadísticas del ${nombreEquipo}`, text: `Partidos jugados en total: ${partidosJugados}\nVictorias: ${victorias}\nDerrotas: ${derrotas}\nEmpates: ${empates}\nGoles a favor: ${golesMarcados}\nGoles en contra: ${golesRecibidos}\nDiferencia de goles: ${difGoles}\nForma: ${forma}\nPosición en la clasificación: ${posicionClasificacion}\nPuntos: ${puntos}\nConsecuencia de la posición en la clasificación: ${consecuenciaClasificacion}`, buttonText: "Ver más", buttonUrl: "Ver más estadísticas del equipo" }));
                  agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname, "idEquipo": idEquipo, "nombreEquipo": nombreEquipo } });
                }

              } else {
                return actualizarEstadisticasEquipo(idEquipo, idLiga, nickname);
              }
            });

          } else {
            return buscarEquipo(equipo, nickname, competicion);
          }

        });
      } else {
        agent.add("Vaya, parece que esa liga no existe o no está disponible para la funcionalidad de estadísticas. Recuerda que de momento estoy capacitado para proporcionar información sobre las grandes ligas de Europa. Para recibir más información sobre esto escribe ayuda.");
        agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
      }
    });
  }
  //=========================================================================================================================================================================
  //BUSCAR MÁXIMOS GOLEADORES Y CLASIFICACIÓN DE COMPETICIÓN
  //=====================================================================================================================================
  function almacenarMaximosGoleadores(maximosGoleadores, fechaHoy, competicion) {
    return refCompeticiones.child(`${competicion}`).child("máximosGoleadores").set({
      listaGoleadores: maximosGoleadores,
      fecha: fechaHoy
    });
  }

  function buscarMaximosGoleadores(nickname, idLiga, competicion) {
    var options = {
      method: 'GET',
      url: 'https://v3.football.api-sports.io/players/topscorers',
      params: { league: idLiga, season: 2020 },
      headers: {
        'x-rapidapi-host': 'v3.football.api-sports.io',
        'x-rapidapi-key': apiKey,
      }
    };
    return axios.request(options).then(function (response) {
      let results = response.data.results;
      console.log("ERRORS:" + results);
      if (results == 0) {
        console.log("HAY ERRORES");
        agent.add("Parece que se ha producido un error con la lista de máximos goleadores de esta competición, vuelve a intentarlo más tarde.");
        agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
      } else {
        let respuesta = response.data.response;
        let len = Object.keys(respuesta).length;
        let maximosGoleadores = `Posición		Jugador       				Goles`;
        let indices = results;
        let fechaHoyTiempo = new Date();
        let fechaHoy = fechaHoyTiempo.getDate() + '/' + (fechaHoyTiempo.getMonth() + 1) + '/' + fechaHoyTiempo.getFullYear();
        if (results > 10) {
          indices = 10;
        }
        for (var i = 0; i < indices; i++) {
          let nombreJugador = respuesta[i].player.name;
          let goles = respuesta[i].statistics[0].goals.total;
          let posicion = `\n${i + 1}`.padEnd(18);
          if (`${i + 1}`.length == 2) {
            posicion = `\n${i + 1}`.padEnd(17);
          }
          nombreJugador = `${nombreJugador}`.padEnd(29 - `${nombreJugador}`.length);

          maximosGoleadores = maximosGoleadores + posicion + nombreJugador + `${goles}`;
        }
        agent.add(`${maximosGoleadores}`);
        agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
        almacenarMaximosGoleadores(maximosGoleadores, fechaHoy, competicion);
      }
    });
  }

  function handleBuscarMaximosGoleadoresLiga(agent) {
    const nickname = agent.parameters.nickname;
    const competicion = agent.parameters.competicion;
    return refCompeticiones.child(`${competicion}`).once('value').then((snapshot) => {
      if (snapshot.exists()) {
        let idLiga = snapshot.val().idAPI;
        let fechaHoyTiempo = new Date();
        let fechaHoy = fechaHoyTiempo.getDate() + '/' + (fechaHoyTiempo.getMonth() + 1) + '/' + fechaHoyTiempo.getFullYear();
        return refCompeticiones.child(`${competicion}`).child("máximosGoleadores").once('value').then((snapshot) => {
          if (snapshot.exists()) {
            let datos = snapshot.val();
            if (datos.fecha != fechaHoy) {
              return buscarMaximosGoleadores(nickname, idLiga, competicion);
            } else {
              let listaGoleadores = datos.listaGoleadores;
              agent.add(`${listaGoleadores}`);
              agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
            }
          } else {
            return buscarMaximosGoleadores(nickname, idLiga, competicion);
          }
        });
      } else {
        agent.add("Vaya, parece que esa liga no existe o no está disponible para la funcionalidad de estadísticas. Recuerda que de momento estoy capacitado para proporcionar información sobre las grandes ligas de Europa. Para recibir más información sobre esto escribe ayuda.");
        agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
      }
    });

  }

  function almacenarClasificacion(clasificacion, fechaHoy, competicion) {
    return refCompeticiones.child(`${competicion}`).child("clasificación").set({
      clasificacion: clasificacion,
      fecha: fechaHoy
    });
  }

  function buscarClasificacion(nickname, idLiga, competicion) {
    var options = {
      method: 'GET',
      url: 'https://v3.football.api-sports.io/standings',
      params: { league: idLiga, season: 2020 },
      headers: {
        'x-rapidapi-host': 'v3.football.api-sports.io',
        'x-rapidapi-key': apiKey,
      }
    };
    return axios.request(options).then(function (response) {
      let results = response.data.results;
      console.log("ERRORS:" + results);
      if (results == 0) {
        console.log("HAY ERRORES");
        agent.add("Parece que se ha producido un error con la clasificación de esta competición, vuelve a intentarlo más tarde.");
        agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
      } else {
        let respuesta = response.data.response[0].league.standings[0];
        let len = Object.keys(respuesta).length;
        let clasificacion = `Posición		Equipo       				Ptos		Partidos	DG`;
        let indices = len;
        let fechaHoyTiempo = new Date();
        let fechaHoy = fechaHoyTiempo.getDate() + '/' + (fechaHoyTiempo.getMonth() + 1) + '/' + fechaHoyTiempo.getFullYear();
        for (var i = 0; i < indices; i++) {
          let estadisticas = respuesta[i];
          let equipo = estadisticas.team.name;
          let posicion = `\n${i + 1}`;
          equipo = `${equipo}`;
          let puntos = estadisticas.points;
          puntos = `${puntos}`.padEnd(7);
          let partidos = estadisticas.all.played;
          partidos = `${partidos}`.padEnd(7);
          let difGoles = estadisticas.goalsDiff;
          if (`${equipo}`.length > 20) {
            if (`${i + 1}`.length == 2) {
              posicion = `\n${i + 1}`.padEnd(3);
            } else {
              posicion = `\n${i + 1}`.padEnd(4);
            }
            equipo = `${equipo}`.padEnd(25);
          }
          else if (`${equipo}`.length > 15) {
            if (`${i + 1}`.length == 2) {
              posicion = `\n${i + 1}`.padEnd(10);
            } else {
              posicion = `\n${i + 1}`.padEnd(11);
            }
            equipo = `${equipo}`.padEnd(22);
          } else {
            if (`${i + 1}`.length == 2) {
              posicion = `\n${i + 1}`.padEnd(15);
            } else {
              posicion = `\n${i + 1}`.padEnd(16);
            }
            equipo = `${equipo}`.padEnd(9 + 22 - `${equipo}`.length);
          }


          clasificacion = clasificacion + posicion + equipo + puntos + partidos + `${difGoles}`;
        }
        agent.add(`${clasificacion}`);
        agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
        almacenarClasificacion(clasificacion, fechaHoy, competicion);
      }
    });
  }

  function handleBuscarClasificacionLiga(agent) {
    const nickname = agent.parameters.nickname;
    const competicion = agent.parameters.competicion;
    return refCompeticiones.child(`${competicion}`).once('value').then((snapshot) => {
      if (snapshot.exists()) {
        let idLiga = snapshot.val().idAPI;
        let fechaHoyTiempo = new Date();
        let fechaHoy = fechaHoyTiempo.getDate() + '/' + (fechaHoyTiempo.getMonth() + 1) + '/' + fechaHoyTiempo.getFullYear();
        return refCompeticiones.child(`${competicion}`).child("clasificación").once('value').then((snapshot) => {
          if (snapshot.exists()) {
            let datos = snapshot.val();
            if (datos.fecha != fechaHoy) {
              return buscarClasificacion(nickname, idLiga, competicion);
            } else {
              let clasificacion = datos.clasificacion;
              agent.add(`${clasificacion}`);
              agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
            }
          } else {
            return buscarClasificacion(nickname, idLiga, competicion);
          }
        });
      } else {
        agent.add("Vaya, parece que esa liga no existe o no está disponible para la funcionalidad de estadísticas. Recuerda que de momento estoy capacitado para proporcionar información sobre las grandes ligas de Europa. Para recibir más información sobre esto escribe ayuda.");
        agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
      }
    });

  }
  //=========================================================================================================================================================================
  //BUSCAR JORNADAS
  //=========================================================================================================================================================================
  function handleBuscarPrediccionesJornada(agent) {
    console.log("PREDICCIONES");
    const nickname = agent.parameters.nickname;
    const numJornada = agent.parameters.numJornada;
    const nombreLocal = agent.parameters.nombreLocal;
    const escudoLocal = agent.parameters.escudoLocal;
    const nombreVisitante = agent.parameters.nombreVisitante;
    const escudoVisitante = agent.parameters.escudoVisitante;
    const estadio = agent.parameters.estadio;
    const arbitro = agent.parameters.arbitro;
    const fecha = agent.parameters.fecha;
    const hora = agent.parameters.hora;
    const idJornada = agent.parameters.idJornada;
    const nombreEquipo = agent.parameters.nombreEquipo;
    var options = {
      method: 'GET',
      url: 'https://v3.football.api-sports.io/predictions',
      params: { fixture: idJornada },
      headers: {
        'x-rapidapi-host': 'v3.football.api-sports.io',
        'x-rapidapi-key': apiKey,
      }
    };
    return axios.request(options).then(function (response) {
      let results = response.data.results;
      console.log("ERRORS:" + results);
      if (results == 0) {
        console.log("HAY ERRORES");
        agent.add(new Card({ title: `Jornada${numJornada}`, text: `${nombreLocal} vs ${nombreVisitante}\nEstadio: ${estadio}\nÁrbitro: ${arbitro}\nFecha: ${fecha}\nHora: ${hora}\n` }));
        agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
      } else {
        let respuesta = response.data.response[0];
        let posibilidadLocal = respuesta.predictions.percent.home;
        let posibilidadEmpate = respuesta.predictions.percent.draw;
        let posibilidadVisitante = respuesta.predictions.percent.away;
        agent.add(new Card({ title: `Jornada${numJornada}`, text: `${nombreLocal} vs ${nombreVisitante}\nEstadio: ${estadio}\nÁrbitro: ${arbitro}\nFecha: ${fecha}\nHora: ${hora}\nPosibilidad de victoria local: ${posibilidadLocal}\nPosibilidad de empate: ${posibilidadEmpate}\nPosibilidad de victoria visitante: ${posibilidadVisitante}` }));
        agent.add(new Card({ title: `${nombreLocal}`, imageUrl: escudoLocal }));
        agent.add(new Card({ title: `${nombreVisitante}`, imageUrl: escudoVisitante }));
        agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
        refEquipos.child(nombreEquipo).child("proximaJornada").update({
          posibilidadLocal: posibilidadLocal,
          posibilidadEmpate: posibilidadEmpate,
          posibilidadVisitante: posibilidadVisitante
        });
      }
    });
  }

  function buscaProximaJornada(idLiga, idEquipo, nickname, equipo, fechaActual) {
    var options = {
      method: 'GET',
      url: 'https://v3.football.api-sports.io/fixtures',
      params: { league: idLiga, season: 2020, team: idEquipo, next: 1 },
      headers: {
        'x-rapidapi-host': 'v3.football.api-sports.io',
        'x-rapidapi-key': apiKey,
      }
    };
    return axios.request(options).then(function (response) {
      console.log("OPTIONS" + JSON.stringify(options));
      let results = response.data.results;
      console.log("ERRORS:" + results);
      if (results == 0) {
        console.log("HAY ERRORES");
        agent.add("Parece que no hay próximas jornadas esta temporada, ya que esta se ha acabado.");
        agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
      } else {
        let respuesta = response.data.response[0];
        console.log("RESPUESTA" + JSON.stringify(respuesta));
        let numJornada = respuesta.league.round.split("-")[1];
        let nombreLocal = respuesta.teams.home.name;
        let escudoLocal = respuesta.teams.home.logo;
        let nombreVisitante = respuesta.teams.away.name;
        let escudoVisitante = respuesta.teams.away.logo;
        let estadio = respuesta.fixture.venue.name;
        let arbitro = respuesta.fixture.referee;
        if (arbitro == null) {
          arbitro = "Desconocido de momento";
        }
        let fechaHora = respuesta.fixture.date;
        let fechaHoraAPI = fechaHora;
        let fecha = "Desconocida de momento";
        let hora = "Desconocida de momento";
        if (fechaHora != null) {
          let fechaHoraAux = new Date(Date.parse(fechaHora));
          fechaHora = fechaHoraAux.toLocaleString('es-ES', { timeZone: 'Europe/Madrid' }).split(", ");
          fecha = fechaHora[0];
          if (fechaHoraAux.getHours() > 0) {
            hora = fechaHora[1];
          }
        }
        let idJornada = respuesta.fixture.id;
        console.log("ANTES DE PREDICCIONES");
        agent.setFollowupEvent({ "name": "BuscarPrediccionesJornada", "parameters": { "nickname": nickname, "numJornada": numJornada, "nombreLocal": nombreLocal, "escudoLocal": escudoLocal, "nombreVisitante": nombreVisitante, "escudoVisitante": escudoVisitante, "estadio": estadio, "arbitro": arbitro, "fecha": fecha, "hora": hora, "idJornada": idJornada, "nombreEquipo": equipo } });
        refEquipos.child(equipo).child("proximaJornada").update({
          idJornada: idJornada,
          numJornada: numJornada,
          nombreLocal: nombreLocal,
          escudoLocal: escudoLocal,
          nombreVisitante: nombreVisitante,
          escudoVisitante: escudoVisitante,
          estadio: estadio,
          arbitro: arbitro,
          fechaHora: fechaHoraAPI,
          fecha: fecha,
          hora: hora,
          fechaAlmacenamiento: fechaActual,
        });
      }
    });
  }

  function handleBuscarProximaJornada(agent) {
    var nickname = agent.parameters.nickname;
    var equipo = agent.parameters.equipo;
    var competicion = agent.parameters.competicion;
    return refCompeticiones.child(`${competicion}`).once('value').then((snapshot) => {
      if (snapshot.exists()) {
        let idLiga = snapshot.val().idAPI;
        return refEquipos.child(`${equipo}`).once('value').then((snapshot) => {
          if (snapshot.exists()) {
            let fechaActual = new Date(new Date().toUTCString());
            let jornadaProxima = snapshot.child("proximaJornada").val();
            if(!snapshot.child("proximaJornada").exists()){
              let datos = snapshot.val();
              let idEquipo = datos.idAPI;
              return buscaProximaJornada(idLiga, idEquipo, nickname, equipo, fechaActual);
            }else{
              let fechaAlmacenamiento = jornadaProxima.fechaAlmacenamiento;
              if((new Date(jornadaProxima.fechaHora)-fechaActual<0)||(new Date(fechaAlmacenamiento).setHours(0, 0, 0, 0) != fechaActual.setHours(0, 0, 0, 0))){
              console.log("HA PASADO LA FECHA DE LA JORNADA:"+jornadaProxima.fechaHora);
              let datos = snapshot.val();
              let idEquipo = datos.idAPI;
              return buscaProximaJornada(idLiga, idEquipo, nickname, equipo, fechaActual);
            }else{
              let numJornada = jornadaProxima.numJornada;
              let nombreLocal = jornadaProxima.nombreLocal;
              let escudoLocal = jornadaProxima.escudoLocal;
              let nombreVisitante = jornadaProxima.nombreVisitante;
              let escudoVisitante = jornadaProxima.escudoVisitante;
              let estadio = jornadaProxima.estadio;
              let arbitro = jornadaProxima.arbitro;
              let fecha = jornadaProxima.fecha;
              let hora = jornadaProxima.fecha;
              let posibilidadLocal = jornadaProxima.posibilidadLocal;
              let posibilidadEmpate = jornadaProxima.posibilidadEmpate;
              let posibilidadVisitante = jornadaProxima.posibilidadVisitante;
              agent.add(new Card({ title: `Jornada${numJornada}`, text: `${nombreLocal} vs ${nombreVisitante}\nEstadio: ${estadio}\nÁrbitro: ${arbitro}\nFecha: ${fecha}\nHora: ${hora}\nPosibilidad de victoria local: ${posibilidadLocal}\nPosibilidad de empate: ${posibilidadEmpate}\nPosibilidad de victoria visitante: ${posibilidadVisitante}` }));
              agent.add(new Card({ title: `${nombreLocal}`, imageUrl: escudoLocal }));
              agent.add(new Card({ title: `${nombreVisitante}`, imageUrl: escudoVisitante }));
              agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
            }
            }
          } else {
            var options = {
              method: 'GET',
              url: 'https://v3.football.api-sports.io/teams',
              params: { search: `${equipo}` },
              headers: {
                'x-rapidapi-host': 'v3.football.api-sports.io',
                'x-rapidapi-key': apiKey,
              }
            };
            return axios.request(options).then(function (response) {
              let errors = response.data.results;
              console.log("ERRORS:" + errors);
              if (errors == 0) {
                console.log("HAY ERRORES");
                agent.add("Vaya, parece que ese equipo no existe o no soy capaz de encontrarlo. Por favor, asegúrate de que estás escribiendo el nombre correctamente y evita escribir cosas como FC o Balompié. Puedes acudir a la clasificación de su liga para ver su nombre.");
                agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
              } else {
                console.log("NO HAY ERRORES");
                let respuesta = response.data.response[0];
                let nombreEquipo = respuesta.team.name;
                let idAPI = respuesta.team.id;
                let escudo = respuesta.team.logo;
                let añofundación = respuesta.team.founded;
                let pais = respuesta.team.country;
                let ciudad = respuesta.venue.city;
                let direccion = respuesta.venue.address;
                let estadio = respuesta.venue.name;
                let capacidadestadio = respuesta.venue.capacity;
                return translate(pais, { from: "en", to: "es", engine: "google", key: translateKey }).then(text => {
                  pais = text;
                  agent.setContext({ "name": "Home", "lifespan": 1 });
                  agent.setFollowupEvent({ "name": "BuscarProximaJornada", "parameters": { "nickname": nickname, "equipo": nombreEquipo, "competicion": competicion } });
                  return refEquipos.once('value').then((snapshot) => {
                    if (snapshot.child(`${nombreEquipo}`).exists()) {
                      console.log("No se añade a BD.");
                    } else {
                      refEquipos.child(`${nombreEquipo}`).set({
                        escudo: escudo,
                        ciudad: ciudad,
                        idAPI: idAPI,
                        añofundación: añofundación,
                        país: pais,
                        dirección: direccion,
                        estadio: estadio,
                        capacidadestadio: capacidadestadio,
                      });
                    }
                  });
                });
              }

            });
          }
        });

      } else {
        agent.add("Vaya, parece que esa liga no existe o no está disponible para la funcionalidad de estadísticas. Recuerda que de momento estoy capacitado para proporcionar información sobre las grandes ligas de Europa. Para recibir más información sobre esto escribe ayuda.");
        agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
      }
    });
  }

  function almacenarJornada(idJornada, numJornada, nombreLocal, escudoLocal, nombreVisitante, escudoVisitante, estadio, arbitro, fecha, hora, idLocal, idVisitante, resultado) {
    return refJornadas.child(idJornada).once('value').then((snapshot) => {
      if (!snapshot.exists()) {
        refJornadas.child(idJornada).set({
          numJornada: numJornada,
          nombreLocal: nombreLocal,
          escudoLocal: escudoLocal,
          nombreVisitante: nombreVisitante,
          escudoVisitante: escudoVisitante,
          estadio: estadio,
          arbitro: arbitro,
          fecha: fecha,
          hora: hora,
          idLocal: idLocal,
          idVisitante: idVisitante,
          resultado: resultado
        });
      }
    });
  }

  function buscaUltimaJornada(idLiga, idEquipo, nickname,equipo, fechaActual) {
    var options = {
      method: 'GET',
      url: 'https://v3.football.api-sports.io/fixtures',
      params: { league: idLiga, season: 2020, team: idEquipo, last: 1 },
      headers: {
        'x-rapidapi-host': 'v3.football.api-sports.io',
        'x-rapidapi-key': apiKey,
      }
    };
    return axios.request(options).then(function (response) {
      console.log("OPTIONS" + JSON.stringify(options));
      let results = response.data.results;
      console.log("ERRORS:" + results);
      if (results == 0) {
        console.log("HAY ERRORES");
        agent.add("Parece que no hay próximas jornadas esta temporada, ya que esta se ha acabado.");
        agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
      } else {
        let respuesta = response.data.response[0];
        console.log("RESPUESTA" + JSON.stringify(respuesta));
        let numJornada = respuesta.league.round.split("-")[1];
        let nombreLocal = respuesta.teams.home.name;
        let escudoLocal = respuesta.teams.home.logo;
        let nombreVisitante = respuesta.teams.away.name;
        let escudoVisitante = respuesta.teams.away.logo;
        let estadio = respuesta.fixture.venue.name;
        let arbitro = respuesta.fixture.referee;
        if (arbitro == null) {
          arbitro = "Desconocido de momento";
        }
        let fechaHora = respuesta.fixture.date;
        let fechaHoraAPI = fechaHora;
        let fecha = "Desconocida de momento";
        let hora = "Desconocida de momento";
        if (fechaHora != null) {
          let fechaHoraAux = new Date(Date.parse(fechaHora));
          fechaHora = fechaHoraAux.toLocaleString('es-ES', { timeZone: 'Europe/Madrid' }).split(", ");
          fecha = fechaHora[0];
          if (fechaHoraAux.getHours() > 0) {
            hora = fechaHora[1];
          }
        }
        let idJornada = respuesta.fixture.id;
        let idLocal = respuesta.teams.home.id;
        let idVisitante = respuesta.teams.away.id;
        let golesLocal = respuesta.goals.home;
        let golesVisitante = respuesta.goals.away;
        let resultado = golesLocal + "-" + golesVisitante;
        agent.add(new Card({ title: `Jornada${numJornada}`, text: `${nombreLocal} vs ${nombreVisitante}\nEstadio: ${estadio}\nÁrbitro: ${arbitro}\nFecha: ${fecha}\nHora: ${hora}\nResultado: ${resultado}` }));
        agent.add(new Card({ title: `${nombreLocal}`, imageUrl: escudoLocal, buttonText: "Ver estadísticas en la jornada", buttonUrl: `Ver estadísticas del equipo ${idLocal} en la jornada ${idJornada}` }));
        agent.add(new Card({ title: `Alineación ${nombreLocal}`, buttonText: "Ver alineación", buttonUrl: `Ver alineación del equipo ${idLocal} en la jornada ${idJornada}` }));
        agent.add(new Card({ title: `${nombreVisitante}`, imageUrl: escudoVisitante, buttonText: "Ver estadísticas en la jornada", buttonUrl: `Ver estadísticas del equipo ${idVisitante} en la jornada ${idJornada}` }));
        agent.add(new Card({ title: `Alineación ${nombreVisitante}`, buttonText: "Ver alineación", buttonUrl: `Ver alineación del equipo ${idVisitante} en la jornada ${idJornada}` }));
        agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
        almacenarJornada(idJornada, numJornada, nombreLocal, escudoLocal, nombreVisitante, escudoVisitante, estadio, arbitro, fecha, hora, idLocal, idVisitante, resultado);
        refEquipos.child(equipo).child("ultimaJornada").update({
          idJornada: idJornada,
          numJornada: numJornada,
          nombreLocal: nombreLocal,
          escudoLocal: escudoLocal,
          nombreVisitante: nombreVisitante,
          escudoVisitante: escudoVisitante,
          estadio: estadio,
          arbitro: arbitro,
          fechaHora: fechaHoraAPI,
          fecha: fecha,
          idLocal: idLocal,
          idVisitante: idVisitante,
          hora: hora,
          fechaAlmacenamiento: fechaActual,
          golesLocal: golesLocal,
          golesVisitante: golesVisitante,
          resultado: resultado
        });

      }
    });
  }

  function handleBuscarUltimaJornada(agent) {
    var nickname = agent.parameters.nickname;
    var equipo = agent.parameters.equipo;
    var competicion = agent.parameters.competicion;
    return refCompeticiones.child(`${competicion}`).once('value').then((snapshot) => {
      console.log("BD: " + JSON.stringify(snapshot.val()));
      if (snapshot.exists()) {
        let idLiga = snapshot.val().idAPI;
        return refEquipos.child(`${equipo}`).once('value').then((snapshot) => {
          if (snapshot.exists()) {
            let fechaActual = new Date(new Date().toUTCString());
            let jornadaUltima = snapshot.child("ultimaJornada").val();
            if(!snapshot.child("ultimaJornada").exists()){
              let datos = snapshot.val();
              let idEquipo = datos.idAPI;
              return buscaUltimaJornada(idLiga, idEquipo, nickname, equipo, fechaActual);
            }else{
              let fechaAlmacenamiento = jornadaUltima.fechaAlmacenamiento;
              if(new Date(fechaAlmacenamiento).setHours(0, 0, 0, 0) != fechaActual.setHours(0, 0, 0, 0)){
              let datos = snapshot.val();
              let idEquipo = datos.idAPI;
              return buscaUltimaJornada(idLiga, idEquipo, nickname, equipo, fechaActual);
            }else{
              let numJornada = jornadaUltima.numJornada;
              let idJornada = jornadaUltima.idJornada;
              let idLocal = jornadaUltima.idLocal;
              let idVisitante = jornadaUltima.idVisitante;
              let nombreLocal = jornadaUltima.nombreLocal;
              let escudoLocal = jornadaUltima.escudoLocal;
              let nombreVisitante = jornadaUltima.nombreVisitante;
              let escudoVisitante = jornadaUltima.escudoVisitante;
              let estadio = jornadaUltima.estadio;
              let arbitro = jornadaUltima.arbitro;
              let fecha = jornadaUltima.fecha;
              let hora = jornadaUltima.fecha;
              let resultado = jornadaUltima.resultado;
              agent.add(new Card({ title: `Jornada${numJornada}`, text: `${nombreLocal} vs ${nombreVisitante}\nEstadio: ${estadio}\nÁrbitro: ${arbitro}\nFecha: ${fecha}\nHora: ${hora}\nResultado: ${resultado}` }));
              agent.add(new Card({ title: `${nombreLocal}`, imageUrl: escudoLocal, buttonText: "Ver estadísticas en la jornada", buttonUrl: `Ver estadísticas del equipo ${idLocal} en la jornada ${idJornada}` }));
              agent.add(new Card({ title: `Alineación ${nombreLocal}`, buttonText: "Ver alineación", buttonUrl: `Ver alineación del equipo ${idLocal} en la jornada ${idJornada}` }));
              agent.add(new Card({ title: `${nombreVisitante}`, imageUrl: escudoVisitante, buttonText: "Ver estadísticas en la jornada", buttonUrl: `Ver estadísticas del equipo ${idVisitante} en la jornada ${idJornada}` }));
              agent.add(new Card({ title: `Alineación ${nombreVisitante}`, buttonText: "Ver alineación", buttonUrl: `Ver alineación del equipo ${idVisitante} en la jornada ${idJornada}` }));
              agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
            }
          }
          } else {
            var options = {
              method: 'GET',
              url: 'https://v3.football.api-sports.io/teams',
              params: { search: `${equipo}` },
              headers: {
                'x-rapidapi-host': 'v3.football.api-sports.io',
                'x-rapidapi-key': apiKey,
              }
            };
            return axios.request(options).then(function (response) {
              let errors = response.data.results;
              console.log("ERRORS:" + errors);
              if (errors == 0) {
                console.log("HAY ERRORES");
                agent.add("Vaya, parece que ese equipo no existe o no soy capaz de encontrarlo. Por favor, asegúrate de que estás escribiendo el nombre correctamente y evita escribir cosas como FC o Balompié. Puedes acudir a la clasificación de su liga para ver su nombre.");
                agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
              } else {
                console.log("NO HAY ERRORES");
                let respuesta = response.data.response[0];
                let nombreEquipo = respuesta.team.name;
                let idAPI = respuesta.team.id;
                let escudo = respuesta.team.logo;
                let añofundación = respuesta.team.founded;
                let pais = respuesta.team.country;
                let ciudad = respuesta.venue.city;
                let direccion = respuesta.venue.address;
                let estadio = respuesta.venue.name;
                let capacidadestadio = respuesta.venue.capacity;
                return translate(pais, { from: "en", to: "es", engine: "google", key: translateKey }).then(text => {
                  pais = text;
                  agent.setContext({ "name": "Home", "lifespan": 1 });
                  agent.setFollowupEvent({ "name": "BuscarUltimaJornada", "parameters": { "nickname": nickname, "equipo": nombreEquipo, "competicion": competicion } });
                  return refEquipos.once('value').then((snapshot) => {
                    if (snapshot.child(`${nombreEquipo}`).exists()) {
                      console.log("No se añade a BD.");
                    } else {
                      refEquipos.child(`${nombreEquipo}`).set({
                        escudo: escudo,
                        ciudad: ciudad,
                        idAPI: idAPI,
                        añofundación: añofundación,
                        país: pais,
                        dirección: direccion,
                        estadio: estadio,
                        capacidadestadio: capacidadestadio,
                      });
                    }
                  });
                });
              }

            });
          }
        });

      } else {
        agent.add("Vaya, parece que esa liga no existe o no está disponible para la funcionalidad de estadísticas. Recuerda que de momento estoy capacitado para proporcionar información sobre las grandes ligas de Europa. Para recibir más información sobre esto escribe ayuda.");
        agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
      }
    });
  }

  function buscaJornadaConcreta(idLiga,idEquipo,nickname,numJornada){
    let jornada = `Regular Season - ${numJornada}`;	
    var options = {
      method: 'GET',
      url: 'https://v3.football.api-sports.io/fixtures',
      params: {league: idLiga,season: 2020, team: idEquipo, round: jornada },
      headers: {
        'x-rapidapi-host': 'v3.football.api-sports.io',
        'x-rapidapi-key': apiKey,
      }
    };
        return axios.request(options).then(function (response) {
      console.log("OPTIONS"+JSON.stringify(options));
      let results = response.data.results;
      console.log("ERRORS:" + results);
      if (results == 0) {
        console.log("HAY ERRORES");
        agent.add("No he sido capaz de encontrar esa jornada, asegúrate de que está escrita correctamente. Ten en cuenta que por ejemplo las ligas de 18 equipos tienen menos jornadas que las ligas de 20.");
        agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
      } else {
        let respuesta = response.data.response[0];
        console.log("RESPUESTA"+JSON.stringify(respuesta));
        let numJornada = respuesta.league.round.split("-")[1];
        let nombreLocal = respuesta.teams.home.name;
        let escudoLocal = respuesta.teams.home.logo;
        let nombreVisitante = respuesta.teams.away.name;
        let escudoVisitante = respuesta.teams.away.logo;
        let estadio = respuesta.fixture.venue.name;
        let arbitro = respuesta.fixture.referee;
        if (arbitro == null){
         arbitro = "Desconocido de momento"; 
        }
        let fechaHora = respuesta.fixture.date;
        let fecha = "Desconocida de momento";
        let hora = "Desconocida de momento";
        if (fechaHora!=null){
          let fechaHoraAux =new Date(Date.parse(fechaHora));
          fechaHora = fechaHoraAux.toLocaleString('es-ES', { timeZone: 'Europe/Madrid' }).split(", ");          
          fecha = fechaHora[0];
          if(fechaHoraAux.getHours()>0){
          hora = fechaHora[1];
          }
        }
        let idJornada = respuesta.fixture.id;
        let idLocal = respuesta.teams.home.id;
        let idVisitante = respuesta.teams.away.id;
        if(respuesta.fixture.status.short === "FT"){
        let golesLocal = respuesta.goals.home;
        let golesVisitante = respuesta.goals.away;
        let resultado = golesLocal+"-"+golesVisitante;
          agent.add(new Card({ title: `Jornada${numJornada}`, text: `${nombreLocal} vs ${nombreVisitante}\nEstadio: ${estadio}\nÁrbitro: ${arbitro}\nFecha: ${fecha}\nHora: ${hora}\nResultado: ${resultado}`}));
          agent.add(new Card({ title: `${nombreLocal}`, imageUrl: escudoLocal, buttonText: "Ver estadísticas en la jornada", buttonUrl: `Ver estadísticas del equipo ${idLocal} en la jornada ${idJornada}`}));
          agent.add(new Card({title: `Alineación ${nombreLocal}`,buttonText: "Ver alineación", buttonUrl: `Ver alineación del equipo ${idLocal} en la jornada ${idJornada}`}));
          agent.add(new Card({ title: `${nombreVisitante}`, imageUrl: escudoVisitante, buttonText: "Ver estadísticas en la jornada", buttonUrl: `Ver estadísticas del equipo ${idVisitante} en la jornada ${idJornada}`}));
          agent.add(new Card({title: `Alineación ${nombreVisitante}`,buttonText: "Ver alineación", buttonUrl: `Ver alineación del equipo ${idVisitante} en la jornada ${idJornada}`}));
          agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname} });
          almacenarJornada(idJornada,numJornada,nombreLocal,escudoLocal,nombreVisitante,escudoVisitante,estadio,arbitro,fecha,hora,idLocal,idVisitante,resultado);
        }else{
          console.log("ANTES DE PREDICCIONES");
          agent.setFollowupEvent({ "name": "BuscarPrediccionesJornada", "parameters": { "nickname": nickname, "numJornada": numJornada, "nombreLocal": nombreLocal, "escudoLocal": escudoLocal, "nombreVisitante": nombreVisitante, "escudoVisitante": escudoVisitante, "estadio": estadio, "arbitro": arbitro, "fecha": fecha, "hora": hora, "idJornada": idJornada } });
        }
        
      }
        });
  }
  
  function handleBuscarJornadaConcreta(agent) {
    var nickname = agent.parameters.nickname;
    var equipo = agent.parameters.equipo;
    var competicion = agent.parameters.competicion;
    var numJornada = agent.parameters.numJornada;
    return refCompeticiones.child(`${competicion}`).once('value').then((snapshot) => {
      console.log("BD: " + JSON.stringify(snapshot.val()));
      if (snapshot.exists()) {
        let idLiga = snapshot.val().idAPI;
        return refEquipos.child(`${equipo}`).once('value').then((snapshot) => {
          if (snapshot.exists()) {
            let datos = snapshot.val();
            let idEquipo = datos.idAPI;
            return buscaJornadaConcreta(idLiga, idEquipo, nickname, numJornada);
          } else {
            var options = {
              method: 'GET',
              url: 'https://v3.football.api-sports.io/teams',
              params: { search: `${equipo}` },
              headers: {
                'x-rapidapi-host': 'v3.football.api-sports.io',
                'x-rapidapi-key': apiKey,
              }
            };
            return axios.request(options).then(function (response) {
              let errors = response.data.results;
              console.log("ERRORS:" + errors);
              if (errors == 0) {
                console.log("HAY ERRORES");
                agent.add("Vaya, parece que ese equipo no existe o no soy capaz de encontrarlo. Por favor, asegúrate de que estás escribiendo el nombre correctamente y evita escribir cosas como FC o Balompié. Puedes acudir a la clasificación de su liga para ver su nombre.");
                agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
              } else {
                console.log("NO HAY ERRORES");
                let respuesta = response.data.response[0];
                let nombreEquipo = respuesta.team.name;
                let idAPI = respuesta.team.id;
                let escudo = respuesta.team.logo;
                let añofundación = respuesta.team.founded;
                let pais = respuesta.team.country;
                let ciudad = respuesta.venue.city;
                let direccion = respuesta.venue.address;
                let estadio = respuesta.venue.name;
                let capacidadestadio = respuesta.venue.capacity;
                return translate(pais, { from: "en", to: "es", engine: "google", key: translateKey }).then(text => {
                  pais = text;
                  agent.setContext({ "name": "Home", "lifespan": 1 });
                  agent.setFollowupEvent({ "name": "BuscarJornadaConcreta", "parameters": { "nickname": nickname, "equipo": nombreEquipo, "competicion": competicion, "numJornada": numJornada } });
                  return refEquipos.once('value').then((snapshot) => {
                    if (snapshot.child(`${nombreEquipo}`).exists()) {
                      console.log("No se añade a BD.");
                    } else {
                      refEquipos.child(`${nombreEquipo}`).set({
                        escudo: escudo,
                        ciudad: ciudad,
                        idAPI: idAPI,
                        añofundación: añofundación,
                        país: pais,
                        dirección: direccion,
                        estadio: estadio,
                        capacidadestadio: capacidadestadio,
                      });
                    }
                  });
                });
              }

            });
          }
        });

      } else {
        agent.add("Vaya, parece que esa liga no existe o no está disponible para la funcionalidad de estadísticas. Recuerda que de momento estoy capacitado para proporcionar información sobre las grandes ligas de Europa. Para recibir más información sobre esto escribe ayuda.");
        agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
      }
    });
  }

  function handleBuscarEstadisticasJornadaEquipo(agent) {
    const nickname = agent.parameters.nickname;
    const idEquipo = agent.parameters.idEquipo;
    const idJornada = agent.parameters.idJornada;
    return refJornadas.child(idJornada).once('value').then((snapshot) => {
      if (!snapshot.exists()) {
        agent.add("Por favor, para buscar una estadística de un equipo en una jornada debes haberla buscado primero.");
        agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
      } else {
        let datos = snapshot.val();
        let numJornada = datos.numJornada;
        console.log("NUMJORNADA:" + numJornada);
        let nombreLocal = datos.nombreLocal;
        let nombreVisitante = datos.nombreVisitante;
        let idVisitante = datos.idVisitante;
        let idLocal = datos.idLocal;
        let idRival = idLocal;
        if (idRival === idEquipo) {
          idRival = idVisitante;
        }
        let resultado = datos.resultado;
        let jornada = `Jornada${numJornada}`;
        return refJornadas.child(idJornada).child("estadísticas").child(idEquipo).once('value').then((snapshot) => {
          if (snapshot.exists()) {
            let estadísticas = snapshot.val();
            let tirosTotales = estadísticas.tirosTotales;
            let tirosPuerta = estadísticas.tirosPuerta;
            let faltas = estadísticas.faltas;
            let fuerasDeJuego = estadísticas.fuerasDeJuego;
            let corners = estadísticas.corners;
            let posesion = estadísticas.posesion;
            let tarjetasAmarillas = estadísticas.tarjetasAmarillas;
            let tarjetasRojas = estadísticas.tarjetasRojas;
            let aciertoPases = estadísticas.aciertoPases;
            let nombreEquipo = estadísticas.nombreEquipo;
            agent.add(new Card({ title: `Estadísticas ${nombreEquipo}`, text: `Jornada${numJornada}\n${nombreLocal} vs ${nombreVisitante}\nResultado: ${resultado}\nDisparos a portería: ${tirosPuerta}\nDisparos totales: ${tirosTotales}\nFaltas: ${faltas}\nFueras de juego: ${fuerasDeJuego}\nCorners: ${corners}\nPosesión: ${posesion}\nTarjetas amarillas: ${tarjetasAmarillas}\nTarjetas rojas: ${tarjetasRojas}\nAcierto de pases: ${aciertoPases}`, buttonText: "Ver estadísticas del rival", buttonUrl: `Ver estadísticas del equipo ${idRival} en la jornada ${idJornada}` }));
            agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });

          } else {
            var options = {
              method: 'GET',
              url: 'https://v3.football.api-sports.io/fixtures/statistics',
              params: { fixture: idJornada, team: idEquipo },
              headers: {
                'x-rapidapi-host': 'v3.football.api-sports.io',
                'x-rapidapi-key': apiKey,
              }
            };
            return axios.request(options).then(function (response) {
              console.log("OPTIONS" + JSON.stringify(options));
              let results = response.data.results;
              console.log("ERRORS:" + results);
              if (results == 0) {
                console.log("HAY ERRORES");
                agent.add("Se ha producido un error en la búsqueda de estadísticas para esta jornada. Por favor, vuelve a intentarlo más tarde.");
                agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
              } else {
                let respuesta = response.data.response[0];
                console.log("RESPUESTA" + JSON.stringify(respuesta));
                let tirosTotales = respuesta.statistics[2].value;
                let tirosPuerta = respuesta.statistics[0].value;
                let faltas = respuesta.statistics[6].value;
                let fuerasDeJuego = respuesta.statistics[8].value;
                if (fuerasDeJuego == null) {
                  fuerasDeJuego = 0;
                }
                let corners = respuesta.statistics[7].value;
                let posesion = respuesta.statistics[9].value;
                let tarjetasAmarillas = respuesta.statistics[10].value;
                let tarjetasRojas = respuesta.statistics[11].value;
                if (tarjetasRojas == null) {
                  tarjetasRojas = 0;
                }
                let aciertoPases = respuesta.statistics[15].value;
                let nombreEquipo = respuesta.team.name;
                agent.add(new Card({ title: `Estadísticas ${nombreEquipo}`, text: `Jornada${numJornada}\n${nombreLocal} vs ${nombreVisitante}\nResultado: ${resultado}\nDisparos a portería: ${tirosPuerta}\nDisparos totales: ${tirosTotales}\nFaltas: ${faltas}\nFueras de juego: ${fuerasDeJuego}\nCorners: ${corners}\nPosesión: ${posesion}\nTarjetas amarillas: ${tarjetasAmarillas}\nTarjetas rojas: ${tarjetasRojas}\nAcierto de pases: ${aciertoPases}`, buttonText: "Ver estadísticas del rival", buttonUrl: `Ver estadísticas del equipo ${idRival} en la jornada ${idJornada}` }));
                agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
                refJornadas.child(idJornada).child("estadísticas").child(idEquipo).set({
                  tirosTotales: tirosTotales,
                  tirosPuerta: tirosPuerta,
                  faltas: faltas,
                  fuerasDeJuego: fuerasDeJuego,
                  corners: corners,
                  posesion: posesion,
                  tarjetasAmarillas: tarjetasAmarillas,
                  tarjetasRojas: tarjetasRojas,
                  aciertoPases: aciertoPases,
                  nombreEquipo: nombreEquipo
                });
              }
            });
          }
        });
      }
    });

  }

  function handleBuscarAlineacionesJornadaEquipo(agent) {
    const nickname = agent.parameters.nickname;
    const idEquipo = agent.parameters.idEquipo;
    const idJornada = agent.parameters.idJornada;
    return refJornadas.child(idJornada).once('value').then((snapshot) => {
      if (!snapshot.exists()) {
        agent.add("Por favor, para buscar una alineación de un equipo en una jornada debes haberla buscado primero.");
        agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
      } else {
        let datos = snapshot.val();
        let numJornada = datos.numJornada;
        console.log("NUMJORNADA:" + numJornada);
        let nombreLocal = datos.nombreLocal;
        let nombreVisitante = datos.nombreVisitante;
        let idVisitante = datos.idVisitante;
        let idLocal = datos.idLocal;
        let idRival = idLocal;
        if (idRival === idEquipo) {
          idRival = idVisitante;
        }
        return refJornadas.child(idJornada).child("alineaciones").child(idEquipo).once('value').then((snapshot) => {
          if (snapshot.exists()) {
            let alineaciones = snapshot.val();
            let entrenador = alineaciones.entrenador;
            let formacion = alineaciones.formacion;
            let titulares = alineaciones.titulares;
            let nombreEquipo = alineaciones.nombreEquipo;
            agent.add(new Card({ title: `Alineación ${nombreEquipo}`, text: `Jornada${numJornada}\n${nombreLocal} vs ${nombreVisitante}\nEntrenador: ${entrenador}\nFormación: ${formacion}\n${titulares}`, buttonText: "Ver suplentes", buttonUrl: `Ver suplentes del equipo ${idEquipo} en la jornada ${idJornada}` }));
            agent.add(new Card({ title: "Alineación del rival", buttonText: "Ver alineación del rival", buttonUrl: `Ver alineación del equipo ${idRival} en la jornada ${idJornada}` }));
            agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });

          } else {
            var options = {
              method: 'GET',
              url: 'https://v3.football.api-sports.io/fixtures/lineups',
              params: { fixture: idJornada, team: idEquipo },
              headers: {
                'x-rapidapi-host': 'v3.football.api-sports.io',
                'x-rapidapi-key': apiKey,
              }
            };
            return axios.request(options).then(function (response) {
              console.log("OPTIONS" + JSON.stringify(options));
              let results = response.data.results;
              console.log("ERRORS:" + results);
              if (results == 0) {
                console.log("HAY ERRORES");
                agent.add("Se ha producido un error en la búsqueda de alineaciones para esta jornada. Por favor, vuelve a intentarlo más tarde.");
                agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
              } else {
                let respuesta = response.data.response[0];
                let suplentesJSON = respuesta.substitutes;
                console.log("RESPUESTA" + JSON.stringify(respuesta));
                let entrenador = respuesta.coach.name;
                let formacion = respuesta.formation;
                let titulares = "Titulares:";
                let onceInicial = respuesta.startXI;
                for (var i = 0; i < 11; i++) {
                  let numero = onceInicial[i].player.number;
                  let nombreJugador = onceInicial[i].player.name;
                  let posicion = onceInicial[i].player.pos;
                  if (posicion === "G") {
                    posicion = "Portero";
                  } else if (posicion === "D") {
                    posicion = "Defensa";
                  } else if (posicion === "M") {
                    posicion = "Centrocampista";
                  } else {
                    posicion = "Atacante";
                  }
                  titulares = titulares + `\n${numero}.\t${nombreJugador} - ${posicion}`;
                }
                let suplentes = "Suplentes:";
                let lenSuplentes = Object.keys(suplentesJSON).length;
                for (var j = 0; j < lenSuplentes; j++) {
                  let numero = suplentesJSON[j].player.number;
                  let nombreJugador = suplentesJSON[j].player.name;
                  let posicion = suplentesJSON[j].player.pos;
                  if (posicion === "G") {
                    posicion = "Portero";
                  } else if (posicion === "D") {
                    posicion = "Defensa";
                  } else if (posicion === "M") {
                    posicion = "Centrocampista";
                  } else {
                    posicion = "Atacante";
                  }
                  suplentes = suplentes + `\n${numero}.\t${nombreJugador} - ${posicion}`;
                }
                let nombreEquipo = respuesta.team.name;
                agent.add(new Card({ title: `Alineación ${nombreEquipo}`, text: `Jornada${numJornada}\n${nombreLocal} vs ${nombreVisitante}\nEntrenador: ${entrenador}\nFormación: ${formacion}\n${titulares}`, buttonText: "Ver suplentes", buttonUrl: `Ver suplentes del equipo ${idEquipo} en la jornada ${idJornada}` }));
                agent.add(new Card({ title: "Alineación del rival", buttonText: "Ver alineación del rival", buttonUrl: `Ver alineación del equipo ${idRival} en la jornada ${idJornada}` }));
                agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
                refJornadas.child(idJornada).child("alineaciones").child(idEquipo).set({
                  entrenador: entrenador,
                  formacion: formacion,
                  titulares: titulares,
                  suplentes: suplentes,
                  nombreEquipo: nombreEquipo
                });
              }
            });
          }
        });
      }
    });

  }

  function handleBuscarSuplentesJornadaEquipo(agent) {
    const nickname = agent.parameters.nickname;
    const idEquipo = agent.parameters.idEquipo;
    const idJornada = agent.parameters.idJornada;
    return refJornadas.child(idJornada).once('value').then((snapshot) => {
      if (!snapshot.exists()) {
        agent.add("Por favor, para ver los suplentes de una jornada búscala primero y pulsa el botón de ver suplentes.");
        agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
      } else {
        let datos = snapshot.val();
        let numJornada = datos.numJornada;
        console.log("NUMJORNADA:" + numJornada);
        let nombreLocal = datos.nombreLocal;
        let nombreVisitante = datos.nombreVisitante;
        let idVisitante = datos.idVisitante;
        let idLocal = datos.idLocal;
        let idRival = idLocal;
        if (idRival === idEquipo) {
          idRival = idVisitante;
        }
        return refJornadas.child(idJornada).child("alineaciones").child(idEquipo).once('value').then((snapshot) => {
          if (!snapshot.exists()) {
            agent.add("Por favor, para ver los suplentes de una jornada búscala primero y pulsa el botón de ver suplentes.");
            agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
          } else {
            let alineaciones = snapshot.val();
            let entrenador = alineaciones.entrenador;
            let formacion = alineaciones.formacion;
            let suplentes = alineaciones.suplentes;
            let nombreEquipo = alineaciones.nombreEquipo;
            agent.add(new Card({ title: `Alineación ${nombreEquipo}`, text: `Jornada${numJornada}\n${nombreLocal} vs ${nombreVisitante}\nEntrenador: ${entrenador}\nFormación: ${formacion}\n${suplentes}`, buttonText: "Ver alineación del rival", buttonUrl: `Ver alineación del equipo ${idRival} en la jornada ${idJornada}` }));
            agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
          }
        });
      }
    });

  }

//=========================================================================================================================================================================
//NOTIFICACIONES
//=========================================================================================================================================================================  
  function buscaUltimaJornadaNotificacion(idEquipo, nickname, equipo, fechaActual, nombreEquipo, idLiga) {
    var options = {
      method: 'GET',
      url: 'https://v3.football.api-sports.io/fixtures',
      params: { season: 2020, team: idEquipo,league: idLiga, last: 1 },
      headers: {
        'x-rapidapi-host': 'v3.football.api-sports.io',
        'x-rapidapi-key': apiKey,
      }
    };
    return axios.request(options).then(function (response) {
      let errors = response.data.results;
      console.log("ERRORS:" + errors);
      if (errors == 0) {
        console.log("HAY ERRORES");
        agent.add("Vaya, parece que ha habido un problema para obtener las notificaciones. Por favor, vuelve a intentarlo más tarde, te redirigiré a la página principal del chatbot.");
        agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
      } else {
        console.log("NO HAY ERRORES");
        let respuesta = response.data.response[0];
        let numJornada = respuesta.league.round.split("-")[1];
        let nombreLocal = respuesta.teams.home.name;
        let escudoLocal = respuesta.teams.home.logo;
        let nombreVisitante = respuesta.teams.away.name;
        let escudoVisitante = respuesta.teams.away.logo;
        let estadio = respuesta.fixture.venue.name;
        let arbitro = respuesta.fixture.referee;
        if (arbitro == null) {
          arbitro = "Desconocido de momento";
        }
        let fechaHora = respuesta.fixture.date;
        let fechaHoraAPI = fechaHora;
        let fecha = "Desconocida de momento";
        let hora = "Desconocida de momento";
        if (fechaHora != null) {
          let fechaHoraAux = new Date(Date.parse(fechaHora));
          fechaHora = fechaHoraAux.toLocaleString('es-ES', { timeZone: 'Europe/Madrid' }).split(", ");
          fecha = fechaHora[0];
          if (fechaHoraAux.getHours() > 0) {
            hora = fechaHora[1];
          }
        }
        let idJornada = respuesta.fixture.id;
        let idLocal = respuesta.teams.home.id;
        let idVisitante = respuesta.teams.away.id;
        let golesLocal = respuesta.goals.home;
        let golesVisitante = respuesta.goals.away;
        let resultado = golesLocal + "-" + golesVisitante;
        let fechaAPIUTC = new Date(fechaHoraAPI);
        if ((fechaActual - fechaAPIUTC > 86400000)) {
          console.log("VER PROXIMA JORNADA");
          agent.setFollowupEvent({ "name": "NotificacionesProximaJornada", "parameters": { "nickname": nickname, "idEquipo": idEquipo, "nombreEquipo": equipo, "idLiga": idLiga } });
        }
        else {
          console.log("VER ULTIMA JORNADA");
          agent.setFollowupEvent({ "name": "VerNotificacionesUltimaJornada", "parameters": { "nickname": nickname, "idEquipo": idEquipo, "nombreEquipo": equipo } });
        }
          almacenarJornada(idJornada, numJornada, nombreLocal, escudoLocal, nombreVisitante, escudoVisitante, estadio, arbitro, fecha, hora, idLocal, idVisitante, resultado);
        refEquipos.child(equipo).child("ultimaJornada").update({
          idJornada: idJornada,
          numJornada: numJornada,
          nombreLocal: nombreLocal,
          escudoLocal: escudoLocal,
          nombreVisitante: nombreVisitante,
          escudoVisitante: escudoVisitante,
          estadio: estadio,
          arbitro: arbitro,
          fechaHora: fechaHoraAPI,
          fecha: fecha,
          idLocal: idLocal,
          idVisitante: idVisitante,
          hora: hora,
          fechaAlmacenamiento: fechaActual,
          golesLocal: golesLocal,
          golesVisitante: golesVisitante,
          resultado: resultado,
          vista: false
        });
      
      }
    });
  }

  function handleLoginRealizado(agent) {
    const nickname = agent.parameters.nickname;
    let refNotificaciones = db.ref(`users/${nickname}/notificaciones`);
    return refNotificaciones.once('value').then((snapshot) => {
      if (snapshot.exists()) {
        console.log("DETECTA NOTIFICACIONES");
        let datos = snapshot.val();
        let idEquipo = datos.idEquipo;
        let equipo = datos.nombreEquipo;
        let idLiga = datos.idLiga;
        let fechaActual = new Date(new Date().toUTCString());
        return refEquipos.child(equipo).once('value').then((snapshot) => {
          if (snapshot.child("ultimaJornada").exists()) {
            let ultimaJornada = snapshot.child("ultimaJornada").val();
            let fechaUTC = new Date(ultimaJornada.fechaHora);
            let fechaAlmacenamiento = ultimaJornada.fechaAlmacenamiento;
            if(ultimaJornada.vista === true){
              console.log("ULTIMA JORNADA YA VISTA");
              agent.setFollowupEvent({ "name": "NotificacionesProximaJornada", "parameters": { "nickname": nickname, "idEquipo": idEquipo, "nombreEquipo": equipo, "idLiga": idLiga  } });
            }
            else if ((fechaActual - fechaUTC > 86400000) || (new Date(fechaAlmacenamiento).setHours(0, 0, 0, 0) != fechaActual.setHours(0, 0, 0, 0))) {
              console.log("ACTUALIZAR ULTIMA JORNADA");
              return buscaUltimaJornadaNotificacion(idEquipo, nickname, equipo, fechaActual, equipo, idLiga);
            }
            else {
              agent.setFollowupEvent({ "name": "VerNotificacionesUltimaJornada", "parameters": { "nickname": nickname, "idEquipo": idEquipo, "nombreEquipo": equipo} });
            }
          } else {
            return buscaUltimaJornadaNotificacion(idEquipo, nickname, equipo, fechaActual, equipo, idLiga);
          }


        });
      } else {
        agent.add("Te doy la bienvenida a Futbot. A partir de aquí ya puedes usar el chatbot con normalidad. Si necesitas ayuda con cualquier funcionalidad solo tienes que escribir 'Ayuda' y te ayudaré en lo que pueda.");
        agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
      }
    });
  }
  
  function handleVerNotificacionesUltimaJornadaYes(agent){
    const nickname = agent.parameters.nickname;
    const nombreEquipo = agent.parameters.nombreEquipo;
    agent.setContext({ "name": "Home", "lifespan": 1});
    agent.setFollowupEvent({ "name": "BuscarUltimaJornadaEquipoFavorito", "parameters": { "nickname": nickname, "nombreEquipo": nombreEquipo } });
    refEquipos.child(nombreEquipo).child("ultimaJornada").update({
      vista: true
    });
  }
  
  function handleVerNotificacionesUltimaJornadaNo(agent){
    const nickname = agent.parameters.nickname;
    const nombreEquipo = agent.parameters.nombreEquipo;
    agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname}});
    agent.add("De acuerdo, si en cualquier momento cambias de idea, puedes consultar esta misma información desde tu lista de equipos favoritos. Te redirijo a la pantalla principal del chatbot para que puedas usarlo con normalidad.");
    refEquipos.child(nombreEquipo).child("ultimaJornada").update({
      vista: true
    });
  }
  
  function buscaProximaJornadaNotificacion(idEquipo, nickname, equipo, fechaActual, nombreEquipo, idLiga) {
    fechaActual = new Date(new Date().toUTCString());
    var options = {
      method: 'GET',
      url: 'https://v3.football.api-sports.io/fixtures',
      params: { season: 2020, team: idEquipo, league: idLiga, next: 1 },
      headers: {
        'x-rapidapi-host': 'v3.football.api-sports.io',
        'x-rapidapi-key': apiKey,
      }
    };
    return axios.request(options).then(function (response) {
      let errors = response.data.results;
      console.log("ERRORS:" + errors);
      if (errors == 0) {
        console.log("HAY ERRORES");
        agent.add("Vaya, parece que ha habido un problema para obtener las notificaciones. Por favor, vuelve a intentarlo más tarde, te redirigiré a la página principal del chatbot.");
        agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
      } else {
        console.log("NO HAY ERRORES");
        let respuesta = response.data.response[0];
        let numJornada = respuesta.league.round.split("-")[1];
        let nombreLocal = respuesta.teams.home.name;
        let escudoLocal = respuesta.teams.home.logo;
        let nombreVisitante = respuesta.teams.away.name;
        let escudoVisitante = respuesta.teams.away.logo;
        let estadio = respuesta.fixture.venue.name;
        let arbitro = respuesta.fixture.referee;
        if (arbitro == null) {
          arbitro = "Desconocido de momento";
        }
        let fechaHora = respuesta.fixture.date;
        let fechaHoraAPI = fechaHora;
        let fecha = "Desconocida de momento";
        let hora = "Desconocida de momento";
        if (fechaHora != null) {
          let fechaHoraAux = new Date(Date.parse(fechaHora));
          fechaHora = fechaHoraAux.toLocaleString('es-ES', { timeZone: 'Europe/Madrid' }).split(", ");
          fecha = fechaHora[0];
          if (fechaHoraAux.getHours() > 0) {
            hora = fechaHora[1];
          }
        }
        let idJornada = respuesta.fixture.id;
        let idLocal = respuesta.teams.home.id;
        let idVisitante = respuesta.teams.away.id;
        let fechaAPIUTC = new Date(fechaHoraAPI);
        if (!(fechaAPIUTC - fechaActual < 86400000 && fechaAPIUTC - fechaActual>=0)) {
          agent.add("Te doy la bienvenida a Futbot. A partir de aquí ya puedes usar el chatbot con normalidad. Si necesitas ayuda con cualquier funcionalidad solo tienes que escribir 'Ayuda' y te ayudaré en lo que pueda.");
              agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
          refEquipos.child(equipo).child("proximaJornada").update({
          idJornada: idJornada,
          numJornada: numJornada,
          nombreLocal: nombreLocal,
          escudoLocal: escudoLocal,
          nombreVisitante: nombreVisitante,
          escudoVisitante: escudoVisitante,
          estadio: estadio,
          arbitro: arbitro,
          fechaHora: fechaHoraAPI,
          fecha: fecha,
          idLocal: idLocal,
          idVisitante: idVisitante,
          hora: hora,
          fechaAlmacenamiento: fechaActual,
          vista: false
        });
        }
        else {
          console.log("VER PROXIMA JORNADA");
          agent.add("El equipo que tienes configurado para recibir notificaciones va a jugar un partido próximamente. ¿Quieres saber más?");
          agent.setContext({ "name": "ConfirmarNotificacionesProximaJornada-followup ", "lifespan": 1, "parameters": { "nickname": nickname, "nombreEquipo": equipo } });
        refEquipos.child(equipo).child("proximaJornada").update({
          idJornada: idJornada,
          numJornada: numJornada,
          nombreLocal: nombreLocal,
          escudoLocal: escudoLocal,
          nombreVisitante: nombreVisitante,
          escudoVisitante: escudoVisitante,
          estadio: estadio,
          arbitro: arbitro,
          fechaHora: fechaHoraAPI,
          fecha: fecha,
          idLocal: idLocal,
          idVisitante: idVisitante,
          hora: hora,
          fechaAlmacenamiento: fechaActual,
          posibilidadLocal: null,
          posibilidadEmpate: null,
          posibilidadVisitante: null,
          vista: false
        });
        }
          
      
      }
    });
  }
  
  function handleVerNotificacionesProximaJornada(agent){
    const nickname = agent.parameters.nickname;
    const idEquipo = agent.parameters.idEquipo;
    const equipo = agent.parameters.nombreEquipo;
    const idLiga = agent.parameters.idLiga;
    let fechaActual = new Date(new Date().toUTCString());
        return refEquipos.child(equipo).once('value').then((snapshot) => {
          if (snapshot.child("proximaJornada").exists()) {
            let proximaJornada = snapshot.child("proximaJornada").val();
            let fechaUTC = new Date(proximaJornada.fechaHora);
            let fechaAlmacenamiento = proximaJornada.fechaAlmacenamiento;
            if(proximaJornada.vista === true){
              agent.add("Te doy la bienvenida a Futbot. A partir de aquí ya puedes usar el chatbot con normalidad. Si necesitas ayuda con cualquier funcionalidad solo tienes que escribir 'Ayuda' y te ayudaré en lo que pueda.");
              agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
            }
            else if ((fechaUTC - fechaActual < 0) || (new Date(fechaAlmacenamiento).setHours(0, 0, 0, 0) != fechaActual.setHours(0, 0, 0, 0))) {
              console.log("ACTUALIZAR PROXIMA JORNADA");
              return buscaProximaJornadaNotificacion(idEquipo, nickname, equipo, fechaActual, equipo, idLiga);
            }
            else if((fechaUTC - fechaActual < 86400000) && (fechaUTC - fechaActual>=0)){
              console.log("VER NOTIFICACIONES PROXIMA JORNADA");
              agent.add("El equipo que tienes configurado para recibir notificaciones va a jugar un partido próximamente. ¿Quieres saber más?");
              agent.setContext({ "name": "ConfirmarNotificacionesProximaJornada-followup ", "lifespan": 1, "parameters": { "nickname": nickname, "nombreEquipo": equipo } });
              
            }
            else{
              console.log("JORNADA PRÓXIMA NO CERCANA");
              console.log(fechaUTC);
              console.log(fechaActual);
              agent.add("Te doy la bienvenida a Futbot. A partir de aquí ya puedes usar el chatbot con normalidad. Si necesitas ayuda con cualquier funcionalidad solo tienes que escribir 'Ayuda' y te ayudaré en lo que pueda.");
              agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
            }
          } else {
            return buscaProximaJornadaNotificacion(idEquipo, nickname, equipo, fechaActual, equipo, idLiga);
          }
        });
  }
  
  function handleConfirmarNotificacionesProximaJornada(agent){
    const nickname = agent.parameters.nickname;
    const nombreEquipo = agent.parameters.nombreEquipo;
    return refEquipos.child(nombreEquipo).child("proximaJornada").once('value').then((snapshot) => {
      if(!snapshot.child("posibilidadEmpate").exists()){
        let jornadaProxima = snapshot.val();
        let idJornada = jornadaProxima.idJornada;
        let numJornada = jornadaProxima.numJornada;
        let nombreLocal = jornadaProxima.nombreLocal;
        let escudoLocal = jornadaProxima.escudoLocal;
        let nombreVisitante = jornadaProxima.nombreVisitante;
        let escudoVisitante = jornadaProxima.escudoVisitante;
        let estadio = jornadaProxima.estadio;
        let arbitro = jornadaProxima.arbitro;
        let fecha = jornadaProxima.fecha;
        let hora = jornadaProxima.fecha;
        console.log("PRE-CONFIRMACION");
    var options = {
      method: 'GET',
      url: 'https://v3.football.api-sports.io/predictions',
      params: { fixture: idJornada },
      headers: {
        'x-rapidapi-host': 'v3.football.api-sports.io',
        'x-rapidapi-key': apiKey,
      }
    };
    return axios.request(options).then(function (response) {
      let results = response.data.results;
      console.log("ERRORS:" + results);
      if (results == 0) {
        console.log("HAY ERRORES");
        agent.add("Ha habido un problema al obtener la información de las predicciones, te devuelvo a la página principal.");
        agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname} });
      } else {
        let respuesta = response.data.response[0];
        let posibilidadLocal = respuesta.predictions.percent.home;
        let posibilidadEmpate = respuesta.predictions.percent.draw;
        let posibilidadVisitante = respuesta.predictions.percent.away;
        console.log("PRE-CONFIRMACION");
        agent.setContext({ "name": "Home", "lifespan": 1});
        agent.add(new Card({ title: `Jornada${numJornada}`, text: `${nombreLocal} vs ${nombreVisitante}\nEstadio: ${estadio}\nÁrbitro: ${arbitro}\nFecha: ${fecha}\nHora: ${hora}\nPosibilidad de victoria local: ${posibilidadLocal}\nPosibilidad de empate: ${posibilidadEmpate}\nPosibilidad de victoria visitante: ${posibilidadVisitante}` }));
        agent.add(new Card({ title: `${nombreLocal}`, imageUrl: escudoLocal }));
        agent.add(new Card({ title: `${nombreVisitante}`, imageUrl: escudoVisitante }));
        refEquipos.child(nombreEquipo).child("proximaJornada").update({
          posibilidadLocal: posibilidadLocal,
          posibilidadEmpate: posibilidadEmpate,
          posibilidadVisitante: posibilidadVisitante,
          vista: true
        });
      }
    });
      }else{
        agent.setContext({ "name": "Home", "lifespan": 1});
        agent.setFollowupEvent({ "name": "BuscarProximaJornadaEquipoFavorito", "parameters": { "nickname": nickname, "nombreEquipo": nombreEquipo } });
    refEquipos.child(nombreEquipo).child("proximaJornada").update({
      vista: true
    });
      }
    });
    
  }
  
  function handleConfirmarNotificacionesProximaJornadaNo(agent){
    const nickname = agent.parameters.nickname;
    const nombreEquipo = agent.parameters.nombreEquipo;
    return refEquipos.child(nombreEquipo).child("proximaJornada").once('value').then((snapshot) => {
      if(!snapshot.child("posibilidadEmpate").exists()){
        let jornadaProxima = snapshot.val();
        let idJornada = jornadaProxima.idJornada;
    var options = {
      method: 'GET',
      url: 'https://v3.football.api-sports.io/predictions',
      params: { fixture: idJornada },
      headers: {
        'x-rapidapi-host': 'v3.football.api-sports.io',
        'x-rapidapi-key': apiKey,
      }
    };
    return axios.request(options).then(function (response) {
      let results = response.data.results;
      console.log("ERRORS:" + results);
      if (results == 0) {
        console.log("HAY ERRORES");
        agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname} });
        refEquipos.child(nombreEquipo).child("proximaJornada").remove();
      } else {
        let respuesta = response.data.response[0];
        let posibilidadLocal = respuesta.predictions.percent.home;
        let posibilidadEmpate = respuesta.predictions.percent.draw;
        let posibilidadVisitante = respuesta.predictions.percent.away;
        console.log("PRE-CONFIRMACION");
        agent.add("Te doy la bienvenida a Futbot. A partir de aquí ya puedes usar el chatbot con normalidad. Si necesitas ayuda con cualquier funcionalidad solo tienes que escribir 'Ayuda' y te ayudaré en lo que pueda.");
        agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
        refEquipos.child(nombreEquipo).child("proximaJornada").update({
          posibilidadLocal: posibilidadLocal,
          posibilidadEmpate: posibilidadEmpate,
          posibilidadVisitante: posibilidadVisitante,
          vista: true
        });
      }
    });
      }else{
        agent.add("Te doy la bienvenida a Futbot. A partir de aquí ya puedes usar el chatbot con normalidad. Si necesitas ayuda con cualquier funcionalidad solo tienes que escribir 'Ayuda' y te ayudaré en lo que pueda.");
        agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
    refEquipos.child(nombreEquipo).child("proximaJornada").update({
      vista: true
    });
      }
    });
    
  }
  
  function handleActivarNotificacionesEquipo(agent){
    const nickname = agent.parameters.nickname;
    const nombreEquipo = agent.parameters.nombreEquipo;
    let refFavoritos = db.ref(`users/${nickname}/favoritos/equipos`);
    let refNotificaciones = db.ref(`users/${nickname}/notificaciones`);
    return refFavoritos.child(nombreEquipo).once('value').then((snapshot) => {
        if(!snapshot.exists()){
          agent.add("Para poder activar las notificaciones de un equipo debe estar primero en tu lista de favoritos. Para cualquiero otra cosa estaré encantado de ayudarte.");
          agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
        }else{
          let idEquipo = snapshot.val().idEquipo;
          return refNotificaciones.once('value').then((snapshot) => {
      if(snapshot.exists()){
        agent.setFollowupEvent({ "name": "ConfirmarActivarNotificaciones", "parameters": { "nickname": nickname, "idEquipo": idEquipo,"nombreEquipo": nombreEquipo} });
      }else{
        var options = {
            method: 'GET',
            url: 'https://v3.football.api-sports.io/leagues',
            params: { season: 2020, team: idEquipo, type: "League" },
            headers: {
              'x-rapidapi-host': 'v3.football.api-sports.io',
              'x-rapidapi-key': apiKey,
            }
          };
          return axios.request(options).then(function (response) {
            let errors = response.data.results;
            console.log("ERRORS:" + errors);
            if (errors == 0) {
              console.log("HAY ERRORES");
              agent.add("Vaya, parece que ese equipo no existe o no soy capaz de encontrarlo. Por favor, asegúrate de que estás escribiendo el nombre correctamente y evita escribir cosas como FC o Balompié. Puedes acudir a la clasificación de su liga para ver su nombre.");
              agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
            } else {
              console.log("NO HAY ERRORES");
              let respuesta = response.data.response[0];
              let nombreLiga = respuesta.league.name;
              let idLiga = respuesta.league.id;
              agent.add(`Se han activado correctamente las notificaciones para el equipo ${nombreEquipo}. Te devuelvo a la pantalla principal del chatbot.`);
        	  agent.setContext({ "name": "Home", "lifespan": 1,"parameters": { "nickname": nickname}});
        	  refNotificaciones.set({
          	  nombreEquipo: nombreEquipo,
          	  idEquipo: idEquipo,
              idLiga: idLiga
        	  });
              refFavoritos.child(nombreEquipo).update({
                nombreLiga: nombreLiga
                });
            }
          });
        
      }
    });
        }
    });
    
  }
  
  function handleDesactivarNotificacionesEquipo(agent){
    const nickname = agent.parameters.nickname;
    const nombreEquipo = agent.parameters.nombreEquipo;
    let refFavoritos = db.ref(`users/${nickname}/favoritos/equipos`);
    let refNotificaciones = db.ref(`users/${nickname}/notificaciones`);
    return refFavoritos.child(nombreEquipo).once('value').then((snapshot) => {
        if(!snapshot.exists()){
          agent.add("Para poder activar las notificaciones de un equipo debe estar primero en tu lista de favoritos. Para cualquiero otra cosa estaré encantado de ayudarte.");
          agent.setContext({ "name": "Home", "lifespan": 1, "parameters": { "nickname": nickname } });
        }else{
          let idEquipo = snapshot.val().idEquipo;
    return refNotificaciones.once('value').then((snapshot) => {
      if(!snapshot.exists()){
        agent.add("No se pueden desactivar las notificaciones si no las has activado previamente. Te devuelvo a la pantalla principal");
        agent.setContext({ "name": "Home", "lifespan": 1,"parameters": { "nickname": nickname}});
      }else{
        agent.add(`Recibido, ya no recibirás más notificaciones del equipo ${nombreEquipo}, puedes activar las notificaciones para otro equipo desde tu lista de favoritos siempre que lo desees. Te devuelvo a la pantalla principal del chatbot.`);
        agent.setContext({ "name": "Home", "lifespan": 1,"parameters": { "nickname": nickname}});
        return refNotificaciones.remove();
      }
    });
        }
    });
  }
  
  function handleConfirmarActivarNotificaciones(agent){
    const nickname = agent.parameters.nickname;
    const nombreEquipo = agent.parameters.nombreEquipo;
    let refNotificaciones = db.ref(`users/${nickname}/notificaciones`);
    let refFavoritos = db.ref(`users/${nickname}/favoritos/equipos`);
    return refFavoritos.child(nombreEquipo).once('value').then((snapshot) => {
      let idEquipo = snapshot.val().idEquipo;
    return refNotificaciones.once('value').then((snapshot) => {
      if(!snapshot.exists()){
        agent.add("No se pueden actualizar las notificaciones si no las has activado previamente. Te devuelvo a la pantalla principal");
        agent.setContext({ "name": "Home", "lifespan": 1,"parameters": { "nickname": nickname}});
      }else{
        agent.add(`Recibido, se ha actualizado el equipo sobre el que recibirás notificaciones. Puedes seguir usando el agente con normalidad.`);
        agent.setContext({ "name": "Home", "lifespan": 1,"parameters": { "nickname": nickname}});
        return refNotificaciones.update({
          nombreEquipo: nombreEquipo,
          idEquipo: idEquipo
        });
      }
    });
    });
	
  }
  
  let intentMap = new Map();
  intentMap.set('RegistrarNickname', handleRegistrarNickname);
  intentMap.set('RegistrarPassword', handleRegistrarPassword);
  intentMap.set('LoginNombreUsuario', handleLoginNombreUsuario);
  intentMap.set('LoginPassword', handleLoginPassword);
  intentMap.set('BuscarEquipo', handleBuscarEquipo);
  intentMap.set('VerificarSiEquipoExisteEnAPI', handleVerificarSiEquipoExisteEnAPI);
  intentMap.set('MostrarEquipoAPI', handleMostrarEquipoAPI);
  intentMap.set('EquipoAFavoritos', handleEquipoAFavoritos);
  intentMap.set('EliminarEquipoFavoritos', handleEliminarEquipoFavoritos);
  intentMap.set('ListarEquiposFavoritos', handleListarEquiposFavoritos);
  intentMap.set('BuscarCompeticion', handleBuscarCompeticion);
  intentMap.set('VerificarSiCompeticionExisteEnAPI', handleVerificarSiCompeticionExisteEnAPI);
  intentMap.set('MostrarCompeticionAPI', handleMostrarCompeticionAPI);
  intentMap.set('CompeticionAFavoritos', handleCompeticionAFavoritos);
  intentMap.set('EliminarCompeticionFavoritos', handleEliminarCompeticionFavoritos);
  intentMap.set('ListarCompeticionesFavoritas', handleListarCompeticionesFavoritas);
  intentMap.set('VerDatos', handleVerDatos);
  intentMap.set('EditarDatos', handleEditarDatos);
  intentMap.set('EditarNombreBD', handleEditarNombreBD);
  intentMap.set('EditarApellidosBD', handleEditarApellidosBD);
  intentMap.set('EditarEmailBD', handleEditarEmailBD);
  intentMap.set('EditarPasswordVerificacion', handleEditarPasswordVerificacion);
  intentMap.set('EditarPasswordBD', handleEditarPasswordBD);
  intentMap.set('CerrarSesion - yes', handleCerrarSesionYes);
  intentMap.set('Ayuda', handleAyuda);
  intentMap.set('Ayuda - fallback', handleAyudaFallback);
  intentMap.set('AyudaEquipos', handleAyudaEquipos);
  intentMap.set('AyudaEquipos - fallback', handleAyudaEquiposFallback);
  intentMap.set('AyudaCompeticiones', handleAyudaCompeticiones);
  intentMap.set('AyudaCompeticiones - fallback', handleAyudaCompeticionesFallback);
  intentMap.set('AyudaJugadores', handleAyudaJugadores);
  intentMap.set('AyudaJugadores - fallback', handleAyudaJugadoresFallback);
  intentMap.set('AyudaJornadas', handleAyudaJornadas);
  intentMap.set('AyudaJornadas - fallback', handleAyudaJornadasFallback);
  intentMap.set('AyudaUsuarios', handleAyudaUsuarios);
  intentMap.set('AyudaUsuarios - fallback', handleAyudaUsuariosFallback);
  intentMap.set('CancelarAyudaEquipos', handleCancelarAyudaEquipos);
  intentMap.set('CancelarAyudaCompeticiones', handleCancelarAyudaCompeticiones);
  intentMap.set('CancelarAyudaJugadores', handleCancelarAyudaJugadores);
  intentMap.set('CancelarAyudaJornadas', handleCancelarAyudaJornadas);
  intentMap.set('CancelarAyudaUsuarios', handleCancelarAyudaUsuarios);
  intentMap.set('AyudaEquiposInfo', handleAyudaEquiposInfo);
  intentMap.set('AyudaEquiposCompeticion', handleAyudaEquiposCompeticion);
  intentMap.set('AyudaEquiposJornada', handleAyudaEquiposJornada);
  intentMap.set('AyudaEquiposFavoritos', handleAyudaEquiposFavoritos);
  intentMap.set('AyudaEquiposLista', handleAyudaEquiposLista);
  intentMap.set('AyudaCompeticionesInfo', handleAyudaCompeticionesInfo);
  intentMap.set('AyudaCompeticionPais', handleAyudaCompeticionPais);
  intentMap.set('AyudaClasificacionCompeticion', handleAyudaClasificacionCompeticion);
  intentMap.set('AyudaGoleadoresCompeticion', handleAyudaGoleadoresCompeticion);
  intentMap.set('AyudaCompeticionesFavoritos', handleAyudaCompeticionesFavoritos);
  intentMap.set('AyudaCompeticionesLista', handleAyudaCompeticionesLista);
  intentMap.set('AyudaJugadoresInfo', handleAyudaJugadoresInfo);
  intentMap.set('AyudaJugadoresCompeticion', handleAyudaJugadoresCompeticion);
  intentMap.set('AyudaJornadaProxima', handleAyudaJornadaProxima);
  intentMap.set('AyudaJornadaUltima', handleAyudaJornadaUltima);
  intentMap.set('AyudaJornadaConcreta', handleAyudaJornadaConcreta);
  intentMap.set('AyudaJornadaAlineacion', handleAyudaJornadaAlineacion);
  intentMap.set('AyudaUsuarioVer', handleAyudaUsuarioVer);
  intentMap.set('AyudaUsuarioEditar', handleAyudaUsuarioEditar);
  intentMap.set('BuscarCompeticionPais', handleBuscarCompeticionPais);
  intentMap.set('SiRegistroCancelar', handleSiRegistroCancelar);
  intentMap.set('RegistrarNombreCancelar', handleRegistrarNombreCancelar);
  intentMap.set('RegistrarApellidosCancelar', handleRegistrarApellidosCancelar);
  intentMap.set('RegistrarEmailCancelar', handleRegistrarEmailCancelar);
  intentMap.set('RegistrarPasswordCancelar', handleRegistrarPasswordCancelar);
  intentMap.set('BuscarJugador', handleBuscarJugador);
  intentMap.set('BuscarEstadisticasJugador', handleBuscarEstadisticasJugador);
  intentMap.set('ActualizarEstadisticasJugador', handleActualizarEstadisticasJugador);
  intentMap.set('AmpliarEstadisticasJugador', handleBuscarAmpliarJugador);
  intentMap.set('BuscarEstadisticasEquipo', handleBuscarEstadisticasEquipo);
  intentMap.set('AmpliarEstadisticasEquipo', handleAmpliarEstadisticasEquipo);
  intentMap.set('BuscarMaximosGoleadoresLiga', handleBuscarMaximosGoleadoresLiga);
  intentMap.set('BuscarClasificacionLiga', handleBuscarClasificacionLiga);
  intentMap.set('BuscarProximaJornada', handleBuscarProximaJornada);
  intentMap.set('BuscarUltimaJornada', handleBuscarUltimaJornada);
  intentMap.set('BuscarJornadaConcreta', handleBuscarJornadaConcreta);
  intentMap.set('BuscarPrediccionesJornada', handleBuscarPrediccionesJornada);
  intentMap.set('BuscarEstadisticasJornadaEquipo', handleBuscarEstadisticasJornadaEquipo);
  intentMap.set('BuscarAlineacionesJornadaEquipo', handleBuscarAlineacionesJornadaEquipo);
  intentMap.set('BuscarSuplentesJornadaEquipo', handleBuscarSuplentesJornadaEquipo);
  intentMap.set('BuscarCompeticionNombreYPais', handleBuscarCompeticionNombreYPais);
  intentMap.set('BuscarEstadisticasEquipoId', handleBuscarEstadisticasEquipoId);
  intentMap.set('BuscarProximaJornadaEquipoFavorito', handleBuscarProximaJornadaEquipoFavorito);
  intentMap.set('BuscarUltimaJornadaEquipoFavorito', handleBuscarUltimaJornadaEquipoFavorito);
  intentMap.set('LoginRealizado', handleLoginRealizado);
  intentMap.set('ActivarNotificacionesEquipo', handleActivarNotificacionesEquipo);
  intentMap.set('DesactivarNotificacionesEquipo', handleDesactivarNotificacionesEquipo);
  intentMap.set('ConfirmarActivarNotificaciones - yes', handleConfirmarActivarNotificaciones);
  intentMap.set('VerNotificacionesUltimaJornada - yes', handleVerNotificacionesUltimaJornadaYes);
  intentMap.set('VerNotificacionesUltimaJornada - no', handleVerNotificacionesUltimaJornadaNo);
  intentMap.set('VerNotificacionesProximaJornada', handleVerNotificacionesProximaJornada);
  intentMap.set('ConfirmarNotificacionesProximaJornada - yes', handleConfirmarNotificacionesProximaJornada);
  intentMap.set('ConfirmarNotificacionesProximaJornada - no', handleConfirmarNotificacionesProximaJornadaNo);
  agent.handleRequest(intentMap);
});
