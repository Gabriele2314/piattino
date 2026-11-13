// Firma d'avvio, decisa in <head> prima del primo fotogramma: completa alla prima apertura della sessione, breve
// (.launch-quick su <html>: solo il piattino che si riempie) quando si ricarica. iOS può tenere sessionStorage anche quando
// riapre dopo ore l'app installata: se l'app non è stata vista negli ultimi 10 minuti (piattino-seen-at, scritto da app.js
// quando va in background o si ricarica) torna la firma completa. Senza l'orario (versione precedente) vale come vista da poco.
try{
  var seen=+localStorage.getItem('piattino-seen-at')||0;
  if(sessionStorage.getItem('piattino-launch')==='1'&&(!seen||Date.now()-seen<6e5))document.documentElement.classList.add('launch-quick');
}catch(e){}
