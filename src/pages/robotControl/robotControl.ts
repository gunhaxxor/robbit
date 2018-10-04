import { Component } from "@angular/core";
import { IonicPage, NavController, NavParams, Platform } from "ionic-angular";
import { LoadingController } from "ionic-angular";
import { BleService } from "../../providers/bleservice/BleService";
import { Socket } from "ng-socket-io";
import * as Peer from "simple-peer";
import nipplejs from "nipplejs";
import { Camera } from "@ionic-native/camera";
import { Diagnostic } from "@ionic-native/diagnostic";
import "webrtc-adapter";
// import encoding from 'text-encoding';

@IonicPage()
@Component({
  selector: "page-robotControl",
  templateUrl: "robotControl.html"
})
export class RobotControlPage {
  peer: any;
  localStream: MediaStream;
  remoteStream: MediaStream;

  //Robotcontrol variabler

  setStatus: any;
  peripheral: any;
  connecteddd: boolean = false;
  uartService: any;
  uartRXCharacteristic: any;
  robotControlIntervalId: any;
  arrowLeftActive: boolean;
  arrowForwardActive: boolean;
  arrowRightActive: boolean;
  arrowBackwardActive: boolean;
  servoUpActive: boolean;
  servoDownActive: boolean;
  cameraOption: string = "constraint";

  constructor(
    public platform: Platform,
    public navCtrl: NavController,
    public loading: LoadingController,
    public navParams: NavParams,
    public bleService: BleService,
    private socket: Socket,
    private camera: Camera,
    private diagnostic: Diagnostic
  ) {
    socket.on("robotControl", msg => {
      console.log("received socket msg: " + JSON.stringify(msg));
      this.bleService.send(msg);
    });
  }

  //Host or Client

  Status() {
    console.log("isRobot:", this.bleService.isRobot);
    if (this.bleService.isRobot) {
      console.log("Listening on calls!");
      this.bleService.start();
      this.initiateListen();
    } else {
      console.log("Click on call to start!");
    }
  }
  loggarn() {
    console.log(
      "Intervals are the same as a backwards clock. Thus its effeciency will be decesed."
    );
  }
  //user is leaving the selected page.
  ionViewWillLeave() {
    clearInterval(this.robotControlIntervalId);
  }
  ionViewDidEnter() {
    console.log("STATUS IS COMING!");
    this.Status();

    let leftMotor = 0;
    let rightMotor = 0;
    let options = {
      zone: document.getElementById("zone_joystick")
    };

    let manager = nipplejs.create(options);
    console.log("hi");

    manager
      .on("added", (evt, nipple) => {
        console.log("added");
        nipple.on("move", (evt, data) => {
          if (data.angle) {
            // px, py are between max distance and -1 * max distans

            let px = -Math.cos(data.angle.radian) * data.distance;
            let py = Math.sin(data.angle.radian) * data.distance;

            console.log("px: " + px);
            console.log("py: " + py);
            let JOYSTICK_MAX_DIST = 50;
            let MOTOR_SCALE = 20;
            // Source of algorithm:
            // http://home.kendra.com/mauser/Joystick.html
            // Calculate R+L (Call it V): V =(100-ABS(X)) * (Y/100) + Y
            let v =
              (JOYSTICK_MAX_DIST - Math.abs(px)) * (py / JOYSTICK_MAX_DIST) +
              py;
            // Calculate R-L (Call it W): W= (100-ABS(Y)) * (X/100) + X
            let w =
              (JOYSTICK_MAX_DIST - Math.abs(py)) * (px / JOYSTICK_MAX_DIST) +
              px;
            // Calculate R: R = (V+W) /2
            rightMotor = (v + w) / 2;
            // Calculate L: L= (V-W)/2
            leftMotor = (v - w) / 2;
            // Do any scaling on R and L your hardware may require.
            rightMotor *= MOTOR_SCALE;
            leftMotor *= MOTOR_SCALE;
            // Send those values to your Robot.
            console.log(" leftMotor:" + leftMotor + "rightMotor:" + rightMotor);
          }
        });
      })
      .on("removed", (evt, nipple) => {
        rightMotor = 0;
        leftMotor = 0;
        console.log("removed");
        nipple.off("move");
      });

    if (this.bleService.sharedState.isConnectedToDevice) {
      console.log(
        "skipping socket emit interval loop because we are connected to BLE"
      );
      return;
    }
    let servo = 165;
    console.log("ionViewWillEnter triggered");
    if (!this.bleService.isRobot) {
      this.robotControlIntervalId = setInterval(() => {
        if (
          !this.bleService.isRobot &&
          !this.bleService.sharedState.isConnectedToDevice
        ) {
          // let forwardAmt = 0;
          // let turnAmt = 0;
          // let motorValue1;
          // let motorValue2;
          // ///Let's check here if we are available to send drive instructions to selected robot.
          // if (this.arrowLeftActive) {
          //   turnAmt -= 1023;
          // }
          // if (this.arrowForwardActive) {
          //   forwardAmt += 1023;
          // }
          // if (this.arrowRightActive) {
          //   turnAmt += 1023;
          // }
          // if (this.arrowBackwardActive) {
          //   forwardAmt -= 1023;
          // }
          if (this.servoUpActive) {
            servo += 15;
          }
          if (this.servoDownActive) {
            servo -= 15;
          }
          servo = Math.max(85, Math.min(165, servo));
          // if (turnAmt == 0) {
          //   motorValue1 = forwardAmt;
          //   motorValue2 = forwardAmt;
          // } else {
          //   motorValue1 = forwardAmt / 2 + turnAmt / 2;
          //   motorValue2 = forwardAmt / 2 - turnAmt / 2;
          // }

          let leftMotorFloored = Math.floor(leftMotor);
          let rightMotorFloored = Math.floor(rightMotor);
          let msg =
            "" +
            rightMotorFloored +
            ";" +
            leftMotorFloored +
            ";" +
            servo +
            "\n";
          console.log("sending robot data to socket");
          this.socket.emit("robotControl", msg);
        }
      }, 300);
    }
  }

  //videolink / test

  initiateListen() {
    this.peer = new Peer({
      initiator: false,
      stream: this.localStream
      // config: {
      //   iceServers: [
      //     { urls: "stun:stun.l.google.com:19302" },
      //     {
      //       urls: "turn:54.197.33.120:3478",
      //       username: "greger",
      //       credential: "bajsmannen"
      //     }
      //   ]
      // }
    });
    this.peer.on("signal", data => {
      console.log("got signal data locally. Passing it on to signaling server");
      this.socket.emit("signal", data);
    });
    this.peer.on("stream", stream => {
      console.log("I am listener. Received stream from initiating peer");
      // got remote video stream, now let's show it in a video tag
      let video: HTMLVideoElement = document.querySelector("#remote-video");
      video.srcObject = stream;
      video.play();
    });
  }

  initiateCall() {
    console.log("starting call as initiator");
    this.peer = new Peer({ initiator: true, stream: this.localStream });
    this.peer.on("signal", data => {
      console.log("got signal data locally. Passing it on to signaling server");
      this.socket.emit("signal", data);
    });
    this.peer.on("stream", stream => {
      console.log("I am initiator. Received stream from listening peer");
      // got remote video stream, now let's show it in a video tag
      var video: HTMLVideoElement = document.querySelector("#remote-video");
      video.srcObject = stream;
      video.play();
    });
  }

  whichCamera() {
    if (this.cameraOption == "environment") {
      this.cameraOption = "constraint";
    } else {
      this.cameraOption = "environment";
    }
    let video: HTMLVideoElement = document.querySelector("#local-video");
    video.pause();
    this.retrieveCamera();
  }

  retrieveCamera() {
    // get video/voice stream
    console.log("retrieving camera!");
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: this.cameraOption }, audio: false })
      .then(stream => {
        console.log("got local media as a stream");
        this.localStream = stream;
        let video: HTMLVideoElement = document.querySelector("#local-video");
        video.srcObject = stream;
        video.play();
      })
      .catch(err => {
        console.log("error: " + err);
      });
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
    return Promise.reject("Du är ful!");
  }

  ionViewDidLoad() {
    // let cameraPromise = this.diagnostic.requestCameraAuthorization(false)
    //   .then(res => console.log("camera request result: " + res))
    //   .catch(err => console.log("camera request failed: " + err));

    
    // let microphonePromise = this.diagnostic.requestMicrophoneAuthorization()
    // .then(res => console.log("microphone request result: " + res))
    // .catch(err => console.log("microphone request failed: " + err));

    this.diagnostic.requestRuntimePermissions([this.diagnostic.permission.CAMERA, this.diagnostic.permission.RECORD_AUDIO])
      .then((statuses) => {
        this.retrieveCamera();
      })
      .catch((err) => console.log("permissions request rejected: " + err));

    // Promise.all([cameraPromise, microphonePromise]).then(() => {
    //   this.retrieveCamera();
    // })
    // Promise.all([
    //   this.permissionCheck(this.androidPermissions.PERMISSION.CAMERA, "camera"),
    //   this.permissionCheck(
    //     this.androidPermissions.PERMISSION.RECORD_AUDIO,
    //     "record audio"
    //   ),
    //   this.permissionCheck(
    //     this.androidPermissions.PERMISSION.CAPTURE_AUDIO_OUTPUT,
    //     "capture audio output"
    //   ),
    //   this.permissionCheck(
    //     this.androidPermissions.PERMISSION.CALL_PHONE,
    //     "phone calls"
    //   )
    // ])
    //   // this.androidPermissions
    //   //   .checkPermission(this.androidPermissions.PERMISSION.CAMERA)
    //   //   // .then((res)=> {return res.hasPermission})
    //   //   // .then((res) => {return res}

    // .then(
    //   () => {
    //     console.log("had all permissions. wuuuhuuu!");
    //     this.retrieveCamera();
    //     // console.log("Has permission? ", result.hasPermission);
    //     // if (result.hasPermission) {

    //     // } else {
    //     //   this.androidPermissions
    //     //     .requestPermissions([
    //     //       this.androidPermissions.PERMISSION.CAMERA,
    //     //       this.androidPermissions.PERMISSION.RECORD_AUDIO
    //     //     ])
    //     //     .then(() => {
    //     //       this.retrieveCamera();
    //     //     });
    //     // }
    //   },
    //   err => {
    //     console.log("didn't have the permissions. requesting now!");
    //     this.androidPermissions
    //       .requestPermissions([
    //         this.androidPermissions.PERMISSION.CAMERA,
    //         this.androidPermissions.PERMISSION.RECORD_AUDIO,
    //         this.androidPermissions.PERMISSION.CALL_PHONE,
    //         this.androidPermissions.PERMISSION.CAPTURE_AUDIO_OUTPUT
    //       ])
    //       .then(() => this.retrieveCamera());
    //   }
    // );

    this.socket.on("signal", data => {
      console.log("received signal message from socket");
      console.log(data);

      this.peer.signal(data);
    });
  }
}
