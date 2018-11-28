import { Component, ElementRef, ViewChild } from "@angular/core";
import { IonicPage, NavController, NavParams, Platform, PopoverController, LoadingController, IonicFormInput } from "ionic-angular";
import { EmojiPage } from '../emoji-page/emoji-page';
// import { BleService } from "../../providers/bleservice/bleService";
import { Socket } from "ng-socket-io";
import * as Peer from "simple-peer";
import nipplejs from "nipplejs";
// import { Camera } from "@ionic-native/camera";
import { Diagnostic } from "@ionic-native/diagnostic";
import "webrtc-adapter";
// import encoding from 'text-encoding';

// @IonicPage()
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
  cameraOption: string = "constraint";
  SERVO_START_VALUE: number = 100;
  SERVO_MAX_VALUE: number = 155;
  SERVO_MIN_VALUE: number = 75;
  videoVerticalFlipped: boolean = false;
  chat: any = { text: "", sendText: "" };
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
    public popoverEmojiCtrl: PopoverController
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
    this.socket.removeAllListeners("robotControl");
    this.socket.removeAllListeners("signal");
    clearInterval(this.robotControlIntervalId);
    this.peer.destroy();
    delete this.peer;
  }

  ionViewDidEnter() {
    console.log("attaching socket events");
    this.socket.on("robotControl", msg => {
      // console.log("received socket msg: " + JSON.stringify(msg));
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
      position: {right: '50%', top: '50%'},
      color: 'white',
      size: 100
    };

    let manager = nipplejs.create(options);

    manager
    .on("move", (evt, data) => {
      if (data.angle) {
        // // px, py are between max distance and -1 * max distans

        let px = -Math.cos(data.angle.radian) * data.distance;
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
    let ROBOT_MOTOR_MAX_THROTTLE = 1000;
    let DRIVE_MOTOR_SCALE = 0.4;
    let TURN_MOTOR_SCALE = 0.2;
    let servoAngle = this.SERVO_START_VALUE;
    let SERVO_SCALE = 5;
    console.log("ionViewWillEnter triggered");
    this.robotControlIntervalId = setInterval(() => {
      if(!this.videoLinkActive) {
        console.log("Not sending anything because we have no connection.");
        return;
      }

      if (this.forwardActive) {
        robotThrottle = ROBOT_MOTOR_MAX_THROTTLE * DRIVE_MOTOR_SCALE;
      }
      else if (this.reverseActive) {
        robotThrottle = -ROBOT_MOTOR_MAX_THROTTLE * DRIVE_MOTOR_SCALE;
      }else{
        robotThrottle = 0;
      }

      let rotationMotorAdjustment = robotRotation * ROBOT_MOTOR_MAX_THROTTLE * TURN_MOTOR_SCALE; // -20 to +20

      let leftMotor = robotThrottle - rotationMotorAdjustment;
      let rightMotor = robotThrottle + rotationMotorAdjustment;

      //Section for constraining motor values within max allowed throttle
      let ratio = 1;
      if(Math.abs(leftMotor) > ROBOT_MOTOR_MAX_THROTTLE || Math.abs(rightMotor) > ROBOT_MOTOR_MAX_THROTTLE){
        ratio = ROBOT_MOTOR_MAX_THROTTLE / Math.max(Math.abs(leftMotor), Math.abs(rightMotor));
      }
      leftMotor *= ratio;
      rightMotor *= ratio;

      let leftMotorFloored = Math.floor(leftMotor);
      let rightMotorFloored = Math.floor(rightMotor);

      servoAngle += servoAngleChange * SERVO_SCALE;
      servoAngle = Math.max(this.SERVO_MIN_VALUE, Math.min(this.SERVO_MAX_VALUE, servoAngle));
      let servoFloored = Math.floor(servoAngle);
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
  }

  initiateCall() {
    console.log("starting call as initiator");
    this.videoLinkWaitingForAnswer = true;
    this.peer = new Peer({ initiator: true, stream: this.localStream });
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
      console.log('connection event!!!');
      this.videoLinkActive = true;
      this.videoLinkWaitingForAnswer = false;

      
      this.removeCameraStream(); // disable video as default
      this.sendEmoji(this.currentEmoji);
      this.sendChat();
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

  }

  endCall() {
    this.sendData({endcall: true});
    this.peer.destroy();
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
    let videoTracks = this.localStream.getVideoTracks();
    if(videoTracks.length == 0)
    {
      console.log("No video tracks found on local stream");
      return;
    }
    this.peer.removeTrack(videoTracks[0], this.localStream);
    this.showCamera = false;
    this.sendData({showDriverCamera: this.showCamera});
    console.log("Video track removed.");
  }

  addCameraStream() {
    if(this.localVideoTrack != null)
    {
      console.log("Adding video track to stream.");
      this.peer.addTrack(this.localVideoTrack, this.localStream);
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
    let audioTracks = this.localStream.getAudioTracks();
    if(audioTracks.length == 0)
    {
      console.log("No audio tracks found on local stream");
      return;
    }
    this.peer.removeTrack(audioTracks[0], this.localStream);
    this.muteAudio = true;
    this.sendData({muteDriver: this.muteAudio});
    console.log("audio track removed.");
  }

  addAudioStream() {
    if(this.localAudioTrack != null)
    {
      console.log("Adding audio track to stream.");
      this.peer.addTrack(this.localAudioTrack, this.localStream);
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

  sendChat() {
    console.log("sending chat");
    console.log(this.chat.text);
    this.sendData({chat:this.chat.text});
    this.chat.sendText = this.chat.text;
    this.chat.text = "";
    // this is a rather ugly way of calling blur(onfocus) on the textfield
    // but we want to close the smartphone keyboard
    // See https://github.com/ionic-team/ionic/issues/14130
    this.chatInput['_native'].nativeElement.blur();
  }

  sendData(sendObj:object) {
    this.peer.send(JSON.stringify(sendObj));
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
}
