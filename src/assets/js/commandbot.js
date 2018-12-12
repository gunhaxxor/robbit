// var CommandBot = function(){
function CommandBot(){
	
	var keyword = "robot";
	var commands = [];
	var noCommandRecognisedCallback = null;
	var languageRecognition = "en-US";
	
	//Keyword handling
	var rKeyword = new webkitSpeechRecognition();
	rKeyword.continuous = true;
	rKeyword.interimResults = true;
	
	var rCommand = new webkitSpeechRecognition();
	rCommand.continuous = false;
	rCommand.interimResults = true;
	
	//Callback setup
	
	rKeyword.onresult = function(event) {
	    for (var i = event.resultIndex; i < event.results.length; ++i) {
		    
				var array = transcriptToArray(event.results[i][0].transcript);	      
        
	      if(array.indexOf(keyword.toLowerCase()) != -1){
	      	stopListeningKeyword();
	        startListeningCommand();
	      }
	      
		  //document.getElementById("speech-result").innerHTML = "Jag har uppfattat: " + event.results[i][0].transcript;

	    }
	}
	
	rCommand.onresult = function(event) {

	    for (var i = event.resultIndex; i < event.results.length; ++i) {
	          	
	      if (event.results[i].isFinal) { //Final results
	
			  var commandFound = false;
  			for(var j = 0; j < commands.length; j++){
  				commandFound = commandFound || commands[j].tryCommand(event.results[i][0].transcript);
  			}
  			
  			if(!commandFound && noCommandRecognisedCallback != null){
	  			noCommandRecognisedCallback();
  			}
	               
	        stopListeningCommand();
	        startListeningKeyword();
	        
	      } 
	      //document.getElementById("speech-result").innerHTML = "Jag har uppfattat: " + event.results[i][0].transcript;
	    }
	}
  
  //Private functions
	
	var startListeningKeyword = function(){
		//document.getElementById("instructions").innerHTML = "Inväntar startkommando: " + keyword;
		rKeyword.start();
	}
	
	var stopListeningKeyword = function(){
	  rKeyword.abort();
	}
	
	var startListeningCommand = function(){
		//document.getElementById("instructions").innerHTML ="Lyssnar på din röst...";
	  //document.getElementById("speech-result").className += "listening";
	  rCommand.start();
	}
	
	var stopListeningCommand = function(){
		//document.getElementById("speech-result").className -= "listening";
	  rCommand.abort();
	}	
  
  var transcriptToArray = function(transcript){
    return transcript.toLowerCase().split(" ");
	}
  
  //Public functions
  this.getLanguageRecognition = function(){
	  return languageRecognition;
  }
  
  this.setLanguageRecognition = function(lang){
	  languageRecognition = lang;
	  rKeyword.lang = languageRecognition;	  
	  rCommand.lang = languageRecognition;
  }
  
  this.setKeyword = function(kw){
	  keyword = kw;
  }
  
  this.getKeyword = function(){
	  return keyword;
  }
  
  this.addCommand = function(command,callback){
  	commands.push(new Command(command,callback));
  }
  
  this.setNoCommandRecognised = function(callback){
	  noCommandRecognisedCallback = callback;
  }
  
  this.run = function(){
  	startListeningKeyword();  
  }

}

var Command = function(t,cb){
	var keys = t.toLowerCase().split(",");

  var callback = cb;
  
	this.tryCommand = function(transcript){
		transcript = transcript.toLowerCase();
		if(this.testCommand(transcript)){
			this.invoke(transcript,this.getParameter(transcript));
			return true;
		}
		return false;
	}
  
  this.testCommand = function(transcript){
	  //return speechArray.indexOf(command) != -1 
  	for(var i = 0; i < keys.length; i++){
  		if(transcript.indexOf(keys[i]) != -1){
	  		return true;	
	  	}
  	}
  	return false;
  }
  
  this.getParameter = function(transcript){
	for(var i = 0; i < keys.length; i++){
		var index = transcript.indexOf(keys[i]);
		if(index != -1){
			return transcript.substr(index + keys[i].length + 1);
		}
	}
	return null;
  }
  
  this.invoke = function(transcript,parameter){
  	callback(transcript,parameter);	
  }
  
}