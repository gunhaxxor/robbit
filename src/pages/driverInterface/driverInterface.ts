import { Component, ElementRef, ViewChild } from "@angular/core";
import { NavController, NavParams, Platform, PopoverController, LoadingController } from "ionic-angular";
import { EmojiPage } from '../emoji-page/emoji-page';
import { SettingsPage } from '../settings-page/settings-page';
// import { BleService } from "../../providers/bleservice/bleService";
import { Socket } from "ng-socket-io";
import * as Peer from "simple-peer";
import nipplejs from "nipplejs";
// import { Camera } from "@ionic-native/camera";
import { Diagnostic } from "@ionic-native/diagnostic";
import "webrtc-adapter";
import { HostListener } from '@angular/core';
// import encoding from 'text-encoding';

declare var CommandBot: any;

@Component({
  selector: "page-driverInterface",
  templateUrl: "driverInterface.html"
})
export class DriverInterfacePage {
  peer: any;
  videoLinkActive: boolean = false;
  videoLinkWaitingForAnswer = false;
  localStream: MediaStream;
  remoteStream: MediaStream;
  localVideoTrack: any;
  localAudioTrack: any;
  showCamera: boolean;
  muteAudio: boolean;
  currentEmoji: string = "🙂";
  robotControlIntervalId: any;
  // arrowLeftActive: boolean;
  // arrowForwardActive: boolean;
  // arrowRightActive: boolean;
  // arrowBackwardActive: boolean;
  forwardActive: boolean;
  reverseActive: boolean;
  isParked: boolean = false;
  isWaving: boolean = false;
  cameraOption: string = "constraint";
  SERVO_START_VALUE: number = 90;
  SERVO_MAX_VALUE: number = 100;
  SERVO_MIN_VALUE: number = 20;
  ROBOT_MOTOR_MAX_THROTTLE: number = 1000;
  DRIVE_MOTOR_SCALE: number = 0.3;
  TURN_MOTOR_SCALE: number = 0.3;
  servoAngle: number = this.SERVO_START_VALUE;
  SERVO_SCALE: number = 5;
  robotName: string;
  attentionSound: any;
  
  videoVerticalFlipped: boolean = false;
  chat: any = { text: "", sendText: "", isShown: false, timeoutSeconds: 60 };
  chatTimeout: any;
  bot: any;
  voiceControlEnabled: boolean = false;
  voiceDriveTimeout: any;
  voiceDriveIntervalMillis: number = 200;
  voiceDriveTimeoutMillis: number = 2000;
  voiceRotateTimeoutMillis: number = 1000;
  voiceRecognitionState: number = -1;
  @ViewChild('chatInput') chatInput: ElementRef;

  constructor(
    public platform: Platform,
    public navCtrl: NavController,
    public loading: LoadingController,
    public navParams: NavParams,
    // public bleService: BleService,
    private socket: Socket,
    // private camera: Camera,
    private diagnostic: Diagnostic,
    public popoverEmojiCtrl: PopoverController,
    public popoverSettingsCtrl: PopoverController
  ) {
    
  }

  // loggarn() {
  //   console.log(
  //     "Intervals are the same as a backwards clock. Thus its effeciency will be decesed."
  //   );
  // }

  //user is leaving the selected page.
  ionViewDidLeave() {
    this.videoLinkActive = false;
  }

  ionViewWillLeave(){
    console.log("will leave driver interface page. Cleaning up som shit");
    this.socket.emit("leave", this.robotName);
    this.socket.removeAllListeners("robotControl");
    this.socket.removeAllListeners("signal");
    clearInterval(this.robotControlIntervalId);
    if(this.peer)
    {
      this.peer.destroy();
    }
    delete this.peer;
  }

  ionViewDidEnter() {

    this.robotName = this.navParams.get('robotName');
    
    if(this.socket.ioSocket.connected){
      this.socket.emit('join', this.robotName);
    }else{
      this.socket.on('connect', () =>{
        this.socket.emit('join', this.robotName);
      });
    }

    console.log("attaching socket events");
    this.socket.on("robotControl", msg => {
      console.log("received socket msg: " + JSON.stringify(msg));
      // this.bleService.send(msg);
    });

    this.socket.on("signal", data => {
      console.log("Driver received signal message from socket");
      console.log(data);

      if(this.peer){
        this.peer.signal(data);
      }
    });

    console.log("trying to fetch camera");
    this.checkNeededPermissions().then(() => {
      this.retrieveCamera();
    }).catch((err) => console.log("failed to get permissions: " + err));


    // Let's divide the motorvariables into drive and look components.
    let robotThrottle = 0;
    let robotRotation = 0;
    let servoAngleChange = 0;
    let options = {
      zone: document.getElementById("zone-joystick"),
      mode: 'static',
      position: {right: '70%', top: '50%'},
      color: 'white',
      size: 150
    };

    let manager = nipplejs.create(options);

    manager
    .on("move", (evt, data) => {
      if (data.angle) {
        // // px, py are between max distance and -1 * max distans

        let px = Math.cos(data.angle.radian) * data.distance;
        let py = Math.sin(data.angle.radian) * data.distance;

        console.log("px: " + px);
        console.log("py: " + py);
        let joystickMaxDistance = options.size/2;

        let x = px / joystickMaxDistance;
        let y = py / joystickMaxDistance;

        robotRotation = x;
        servoAngleChange = y;

        // Source of algorithm:
        // http://home.kendra.com/mauser/Joystick.html
        // Calculate R+L (Call it V): V =(100-ABS(X)) * (Y/100) + Y
        // let v =
        //   (JOYSTICK_MAX_DIST - Math.abs(px)) * (py / JOYSTICK_MAX_DIST) +
        //   py;
        // // Calculate R-L (Call it W): W= (100-ABS(Y)) * (X/100) + X
        // let w =
        //   (JOYSTICK_MAX_DIST - Math.abs(py)) * (px / JOYSTICK_MAX_DIST) +
        //   px;
        // Calculate R: R = (V+W) /2
        // rightMotor = (v + w) / 2;
        // // Calculate L: L= (V-W)/2
        // leftMotor = (v - w) / 2;
        // // Do any scaling on R and L your hardware may require.
        // rightMotor *= MOTOR_SCALE;
        // leftMotor *= MOTOR_SCALE;
        
        // // Send those values to your Robot.
        // console.log(" leftMotor:" + leftMotor + "rightMotor:" + rightMotor);
      }
    })
    .on("end", (evt, nipple) => {
      robotRotation = 0;
      servoAngleChange = 0;
      console.log("joystick released");
    });

    //TODO: Send robotcontrol over RTCDatachannel? As of now we're using the signaling socket. meh...
    console.log("ionViewWillEnter triggered");
    this.robotControlIntervalId = setInterval(() => {
      if(!this.videoLinkActive) {
        //console.log("Not sending anything because we have no connection.");
        return;
      }

      if (this.forwardActive) {
        robotThrottle = this.ROBOT_MOTOR_MAX_THROTTLE * this.DRIVE_MOTOR_SCALE;
      }
      else if (this.reverseActive) {
        robotThrottle = -this.ROBOT_MOTOR_MAX_THROTTLE * this.DRIVE_MOTOR_SCALE;
      }else{
        robotThrottle = 0;
      }

      let rotationMotorAdjustment = robotRotation * this.ROBOT_MOTOR_MAX_THROTTLE * this.TURN_MOTOR_SCALE; // -20 to +20

      let leftMotor = robotThrottle + rotationMotorAdjustment;
      let rightMotor = robotThrottle - rotationMotorAdjustment;

      //Section for constraining motor values within max allowed throttle
      let ratio = 1;
      if(Math.abs(leftMotor) > this.ROBOT_MOTOR_MAX_THROTTLE || Math.abs(rightMotor) > this.ROBOT_MOTOR_MAX_THROTTLE){
        ratio = this.ROBOT_MOTOR_MAX_THROTTLE / Math.max(Math.abs(leftMotor), Math.abs(rightMotor));
      }
      leftMotor *= ratio;
      rightMotor *= ratio;

      let leftMotorFloored = Math.floor(leftMotor);
      let rightMotorFloored = Math.floor(rightMotor);

      this.servoAngle += servoAngleChange * this.SERVO_SCALE;
      this.servoAngle = Math.max(this.SERVO_MIN_VALUE, Math.min(this.SERVO_MAX_VALUE, this.servoAngle));
      let servoFloored = Math.floor(this.servoAngle);
      // if (turnAmt == 0) {
      //   motorValue1 = forwardAmt;
      //   motorValue2 = forwardAmt;
      // } else {
      //   motorValue1 = forwardAmt / 2 + turnAmt / 2;
      //   motorValue2 = forwardAmt / 2 - turnAmt / 2;
      // }

      
      let msg =
        "" +
        leftMotorFloored +
        "," +
        rightMotorFloored +
        "," +
        servoFloored +
        "\n";
      console.log("sending robot data to socket: " + msg);
      this.socket.emit("robotControl", msg);
    }, 300);

    if(this.voiceControlEnabled) {
      this.setupSpeechRecognition();
    }

    this.attentionSound = new Audio();
    this.attentionSound.src = "assets/sound/kickhat-open-button-2.mp3";
    this.attentionSound.load();

    // ugly hack for now, to make it call the robot after a short delay
    // hoping that all webrtc setup is done by then.
    // Maybe we can do this with a promise instead?
    setTimeout(() => {
      this.initiateCall();
    }, 2000);
  }

  @HostListener('document:keydown', ['$event'])
  @HostListener('document:keyup', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) { 
    // console.log("key down:"+event.key);
    
    if(document.activeElement.className.includes("text-input")) {
      return;
    }

    if(event.type == "keydown") {
      switch (event.key) {
        case 'ArrowUp':
          this.angleChange(1);
          break;
        case 'ArrowDown':
          this.angleChange(-1);
          break;
        case 'ArrowLeft':
          this.drive(-1, 1, true);
          break;
        case 'ArrowRight':
          this.drive(1, -1, true);
          break;
        case 'a':
          this.forwardActive = true;
          break;
        case 'z':
          this.reverseActive = true;
          break;
        case 'i':
          this.presentSettingsPopover(undefined);
          break;
        case 'e':
          if(!this.showCamera) {
            this.presentEmojiPopover(undefined);
          }
          break;
        case 'k':
          this.toggleCameraStream();
          break;
        case 'm':
          this.toggleAudioStream();
          break;
        case 'w':
          this.toggleWaving();
          break;
      }
    }
    else if(event.type == "keyup") {
      switch (event.key) {
        case "a":
          this.forwardActive = false;
          break;
        case "z":
          this.reverseActive = false;
          break;
      }
    }
  }

  initiateCall() {
    console.log("starting call as initiator");
    this.videoLinkWaitingForAnswer = true;
    let peerConfig = JSON.parse(process.env.PEER_CONFIG);
    this.peer = new Peer({ initiator: true, stream: this.localStream, config: peerConfig });
    console.log("peer object is:");
    console.log(this.peer);
    this.peer.on("signal", data => {
      console.log("Driver got signal data locally. Passing it on to signaling server");
      this.socket.emit("signal", data);
    });
    this.peer.on("stream", stream => {
      console.log("I am Driver and I am initiator. Received stream from listening peer");
      // got remote video stream, now let's show it in a video tag
      var video: any = document.querySelector("#driver-remote-video");
      video.srcObject = stream;
      // video.play();
    });
    this.peer.on('connect', () => {
      console.log('peer connection event');
      console.log("peer object is:");
      console.log(this.peer);
      this.videoLinkActive = true;
      this.videoLinkWaitingForAnswer = false;

      
      this.removeCameraStream(); // disable video as default
      this.sendEmoji(this.currentEmoji);
      this.clearChat();
    });
    this.peer.on('close', () => {
      console.log('peer connection closed');
      console.log('this.peer: ' + this.peer); 
      // this.peer.destroy();
      // delete this.peer;
      this.videoLinkActive = false;
      this.videoLinkWaitingForAnswer = false;
    });
    this.peer.on('unhandledRejection', (reason, p) => {
        console.log("!! unhandledRejection "+reason+ " "+p);
    });
    this.peer.on('uncaughtException', err => {
      // HANDLE ERROR HERE
      console.log("!! uncaughtException "+err);
    });
      this.peer.on('error', err => {
      console.log("!! error "+err);
    });
    this.peer.on("data", msg => {
      let msgObj = JSON.parse(String(msg));

      if(msgObj.hasOwnProperty("isParked")) {
        this.isParked = msgObj.isParked;
        console.log(this.isParked);
      }
    });

  }

  endCall() {
    this.sendData({endcall: true});
    if(this.peer)
    {
      this.peer.destroy();
    }
    this.navCtrl.pop();
  }

  changeCamera() {
    if (this.cameraOption == "environment") {
      this.cameraOption = "constraint";
    } else {
      this.cameraOption = "environment";
    }
    let video: HTMLVideoElement = document.querySelector("#driver-local-video");
    video.pause();
    this.retrieveCamera();
  }

  toggleCameraStream() {
    this.showCamera = !this.showCamera;
    if(this.showCamera) {
      this.addCameraStream();
    }
    else {
      this.removeCameraStream();
    }
  }

  removeCameraStream() {
    console.log("removing camera stream");
    if(!this.localStream){
      console.log("no local stream available for removal!");
      return;
    }
    let videoTracks = this.localStream.getVideoTracks();
    if(!videoTracks || videoTracks.length == 0)
    {
      console.log("No video tracks found on local stream");
      return;
    }
    if(this.peer != null) {
      this.peer.removeTrack(videoTracks[0], this.localStream);
    }
    this.showCamera = false;
    this.sendData({showDriverCamera: this.showCamera});
    console.log("Video track removed.");
  }

  addCameraStream() {
    if(!this.peer) {
      return;
    }
    if(this.localVideoTrack != null)
    {
      console.log("Adding video track to stream.");
      if(this.peer != null) {
        this.peer.addTrack(this.localVideoTrack, this.localStream);
      }
      this.showCamera = true;
      this.sendData({showDriverCamera: this.showCamera});
    }
    
  }

  toggleAudioStream() {
    this.muteAudio = !this.muteAudio;
    if(this.muteAudio) {
      this.removeAudioStream();
    }
    else {
      this.addAudioStream();
    }
  }

  removeAudioStream() {
    if(!this.peer) {
      return;
    }
    let audioTracks = this.localStream.getAudioTracks();
    if(audioTracks.length == 0)
    {
      console.log("No audio tracks found on local stream");
      return;
    }
    if(this.peer != null) {
      this.peer.removeTrack(audioTracks[0], this.localStream);
    }
    this.muteAudio = true;
    this.sendData({muteDriver: this.muteAudio});
    console.log("audio track removed.");
  }

  addAudioStream() {
    if(!this.peer) {
      return;
    }
    if(this.localAudioTrack != null)
    {
      console.log("Adding audio track to stream.");
      if(this.peer != null) {
        this.peer.addTrack(this.localAudioTrack, this.localStream);
      }
      this.muteAudio = false;
      this.sendData({muteDriver: this.muteAudio});
    }
  }

  retrieveCamera() {
    // get video/voice stream
    console.log("retrieving camera!");
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: this.cameraOption }, audio: true })
      .then(stream => {
        console.log("Driver got local media as a stream");
        this.localStream = stream;
        let video: HTMLVideoElement = document.querySelector("#driver-local-video");
        this.localVideoTrack = stream.getVideoTracks()[0];
        this.localAudioTrack = stream.getAudioTracks()[0];
        video.srcObject = stream;
        video.volume = 0;
        // video.play();
        this.showCamera = true;
        this.muteAudio = false;
      })
      .catch(err => {
        console.log("error: " + err);
      });
  }

  presentEmojiPopover(myEvent) {
    let popover = this.popoverEmojiCtrl.create(EmojiPage);
    popover.present({
      ev: myEvent
    });
    popover.onDidDismiss(text => {
      if(text == null) {
        return;
      }
      this.currentEmoji = text;
      this.sendEmoji(text);
    });
  }

  sendEmoji(text:String) {
    this.sendData({emoji:text});
  }

  presentSettingsPopover(myEvent) {
    let popover = this.popoverSettingsCtrl.create(SettingsPage, {
      driverPage: ()=> {return this;}
    });
    popover.present({
      ev: myEvent
    });
    popover.onDidDismiss(text => {
      if(text == null) {
        return;
      }
    });
  }

  clearChat() {
    this.chat.isShown = false;
    this.sendData({chat: {text: this.chat.sendText, isShown: this.chat.isShown}});
  }

  sendChat() {
    console.log("sending chat");
    console.log(this.chat.text);
    this.chat.isShown = true;
    this.sendData({chat: {text: this.chat.text, isShown: this.chat.isShown}});
    this.chat.sendText = this.chat.text;
    this.chat.text = "";
    // this is a rather ugly way of calling blur(onfocus) on the textfield
    // but we want to close the smartphone keyboard
    // See https://github.com/ionic-team/ionic/issues/14130
    this.chatInput['_native'].nativeElement.blur();
    if(this.chat.sendText != "") {
      if(this.chatTimeout) {
        clearTimeout(this.chatTimeout);
      }
      this.chatTimeout = setTimeout(() => {
        this.clearChat();
      }, this.chat.timeoutSeconds*1000);
    }
    else {
      this.clearChat();
    }
  }

  sendData(sendObj:object) {
    if(this.peer != null){
      try{
        this.peer.send(JSON.stringify(sendObj));
      }
      catch(err) {
        console.log("Error while trying to send data:");
        console.log(err);
      }
    }
  }

  // permissionCheck(permission, name) {
  //   this.androidPermissions.checkPermission(permission).then(res => {
  //     console.log(name + " permission: " + res.hasPermission);
  //     if (!res.hasPermission) {
  //       return Promise.reject("no permission for " + name + "!");
  //     }
  //     return Promise.resolve();
  //   });
  // }

  checkNeededPermissions(){
    // let returnPromise = new Promise();
    if(this.diagnostic.isCameraAuthorized(false) && this.diagnostic.isMicrophoneAuthorized()){
      return Promise.resolve();
    }
    return Promise.reject("Camera and mic authorization promise rejected!");
  }

  toggleParking() {
    this.isParked = !this.isParked;
    this.sendData({isParked: this.isParked});
  }

  toggleWaving() {
    this.isWaving = !this.isWaving;
    this.sendData({isWaving: this.isWaving});
    if(this.isWaving) {
      this.attentionSound.play();
    }
  }

  setupSpeechRecognition() {
    console.log("Initiating speech recognition.");
    
    if(!this.bot) {
      this.bot = new CommandBot;
      this.bot.setLanguageRecognition("sv-SE");
      this.bot.setKeyword("Robot");
      this.bot.setNoKeywordMode(false);
      this.bot.setKeywordRecognised(()=>{
        this.voiceRecognitionState = 1;
      });
      this.bot.setCommandRecognised(()=>{
        this.voiceRecognitionState = 2;
        setTimeout(()=>{
          this.voiceRecognitionState = 0;
        }, 1000);
      });
      this.bot.setNoCommandRecognised(()=>{
        this.voiceRecognitionState = 3;
        setTimeout(()=>{
          this.voiceRecognitionState = 0;
        }, 1000);
      });
  
  
      this.bot.addCommand("who are you", ()=>{
        console.log("I am your personal robot.");
      });
      this.bot.addCommand("kör framåt", ()=>{
        clearInterval(this.voiceDriveTimeout);
        this.drive(1, 1, false);
        this.voiceDriveTimeout = setInterval(() => {
          this.drive(1, 1, false);
        }, this.voiceDriveIntervalMillis);
        setTimeout(()=>{
          clearInterval(this.voiceDriveTimeout);
        }, this.voiceDriveTimeoutMillis);
      });
      this.bot.addCommand("kör bakåt", ()=>{
        clearInterval(this.voiceDriveTimeout);
        this.drive(-1, -1, false);
        this.voiceDriveTimeout = setInterval(() => {
          this.drive(-1, 1, false);
        }, this.voiceDriveIntervalMillis);
        setTimeout(()=>{
          clearInterval(this.voiceDriveTimeout);
        }, this.voiceDriveTimeoutMillis);
      });
      this.bot.addCommand("vänster", ()=>{
        clearInterval(this.voiceDriveTimeout);
        this.drive(-1, 1, true);
        this.voiceDriveTimeout = setInterval(() => {
          this.drive(-1, 1, true);
        }, this.voiceDriveIntervalMillis);
        setTimeout(()=>{
          clearInterval(this.voiceDriveTimeout);
        }, this.voiceRotateTimeoutMillis);
      });
      this.bot.addCommand("höger", ()=>{
        clearInterval(this.voiceDriveTimeout);
        this.drive(1, -1, true);
        this.voiceDriveTimeout = setInterval(() => {
          this.drive(1, -1, true);
        }, this.voiceDriveIntervalMillis);
        setTimeout(()=>{
          clearInterval(this.voiceDriveTimeout);
        }, this.voiceRotateTimeoutMillis);
      });
      this.bot.addCommand("stopp", ()=>{
        clearInterval(this.voiceDriveTimeout);
      });
      this.bot.addCommand("titta upp", ()=>{
        this.angleChange(5);
      });
      this.bot.addCommand("titta ner", ()=>{
        this.angleChange(-5);
      });
      this.bot.addCommand("räck upp handen", ()=>{
        this.toggleWaving();
      });
      this.bot.addCommand("ta ner handen", ()=>{
        this.isWaving = false;
      });
      this.bot.addCommand("avsluta", ()=>{
        this.navCtrl.pop();
      });
      this.bot.addCommand("ring upp", ()=>{
        this.initiateCall();
      });
      this.bot.addCommand("video", ()=>{
        this.toggleCameraStream();
      });
      this.bot.addCommand("mikrofon", ()=>{
        this.toggleAudioStream();
      });
      // this.bot.addCommand("lyssna", ()=>{
      //   this.bot.setNoKeywordMode(true);
      // });
      // this.bot.addCommand("lyssna inte", ()=>{
      //   this.bot.setNoKeywordMode(false);
      // });
    }

    this.bot.run();
    this.voiceRecognitionState = 0;
  }

  setVoiceControl() {
    if(this.voiceControlEnabled) {
      console.log("starting voice control");
      
      this.setupSpeechRecognition();
    }
    else {
      console.log("stopping voice control");
      this.bot.stop();

    }
  }

  drive(leftMotor:number, rightMotor:number, isRotation:boolean ) {
    let leftMotorFloored = 0;
    let rightMotorFloored = 0;

    if(isRotation) {
      let robotRotation = 1.0;
      let rotationMotorAdjustment = robotRotation * this.ROBOT_MOTOR_MAX_THROTTLE * this.TURN_MOTOR_SCALE; // -20 to +20

      leftMotorFloored = Math.floor(leftMotor * rotationMotorAdjustment);
      rightMotorFloored = Math.floor(rightMotor * rotationMotorAdjustment);
    }
    else {
      leftMotorFloored = Math.floor(leftMotor * this.ROBOT_MOTOR_MAX_THROTTLE * this.DRIVE_MOTOR_SCALE);
      rightMotorFloored = Math.floor(rightMotor * this.ROBOT_MOTOR_MAX_THROTTLE * this.DRIVE_MOTOR_SCALE);
    }
    let servoFloored = Math.floor(this.servoAngle);
    let msg =
      "" +
      leftMotorFloored +
      "," +
      rightMotorFloored +
      "," +
      servoFloored +
      "\n";
    console.log("sending robot data to socket: " + msg);
    this.socket.emit("robotControl", msg);
  }

  
  angleChange(servoAngleChange) {
    let leftMotorFloored = 0;
    let rightMotorFloored = 0;
    this.servoAngle += servoAngleChange * this.SERVO_SCALE;
    this.servoAngle = Math.max(this.SERVO_MIN_VALUE, Math.min(this.SERVO_MAX_VALUE, this.servoAngle));
    let servoFloored = Math.floor(this.servoAngle);

    let msg =
      "" +
      leftMotorFloored +
      "," +
      rightMotorFloored +
      "," +
      servoFloored +
      "\n";
    console.log("sending robot data to socket: " + msg);
    this.socket.emit("robotControl", msg);
  }

  
}
