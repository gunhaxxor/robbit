let SERVO_START_VALUE = 90
let SERVO_MAX_VALUE = 100
let SERVO_MIN_VALUE = 20
let SERVO_Q = 0.3
let MOTOR_RECEIVED_MAX = 1000;
let ROBOT_LENGTH = 285;
let ROBOT_WIDTH = 230;
let motorTargetSpeeds: number[] = [0, 0];
let isConnected = false
let servoValue = SERVO_START_VALUE
let servoTargetValue = SERVO_START_VALUE

let targetSpeed = 0
let speed = 0
let SERVO_CALIBRATE1 = 75
let SERVO_CALIBRATE2 = 75
let SERVO_CALIBRATE3 = 75
let SERVO_CALIBRATE4 = 85
let rotateMode = false
let wheelServosReady = false
let motorDirection = Kitronik_Robotics_Board.MotorDirection.Forward
let oppositeMotorDirection = Kitronik_Robotics_Board.MotorDirection.Reverse



function strafe(direction: number) {
    rotateMode = false
    Kitronik_Robotics_Board.servoWrite(Kitronik_Robotics_Board.Servos.Servo1, SERVO_CALIBRATE1 + direction)
    Kitronik_Robotics_Board.servoWrite(Kitronik_Robotics_Board.Servos.Servo2, SERVO_CALIBRATE2 + direction)
    Kitronik_Robotics_Board.servoWrite(Kitronik_Robotics_Board.Servos.Servo3, SERVO_CALIBRATE3 + direction)
    Kitronik_Robotics_Board.servoWrite(Kitronik_Robotics_Board.Servos.Servo4, SERVO_CALIBRATE4 + direction)
}
function turn(direction: number) {
    rotateMode = false
    let innerDirection = Math.atan((Math.tan(90 - (direction * Math.PI / 180)) * ROBOT_LENGTH / 2 - ROBOT_WIDTH) / (ROBOT_LENGTH / 2)) / (Math.PI / 180)
    if (direction != 0) {
        basic.showNumber(innerDirection, 80)
    }
    if (direction > 0) {
        Kitronik_Robotics_Board.servoWrite(Kitronik_Robotics_Board.Servos.Servo1, SERVO_CALIBRATE1 + direction)
        Kitronik_Robotics_Board.servoWrite(Kitronik_Robotics_Board.Servos.Servo2, SERVO_CALIBRATE2 + innerDirection)
        Kitronik_Robotics_Board.servoWrite(Kitronik_Robotics_Board.Servos.Servo3, SERVO_CALIBRATE3 - direction)
        Kitronik_Robotics_Board.servoWrite(Kitronik_Robotics_Board.Servos.Servo4, SERVO_CALIBRATE4 - innerDirection)
    } else {
        Kitronik_Robotics_Board.servoWrite(Kitronik_Robotics_Board.Servos.Servo1, SERVO_CALIBRATE1 + innerDirection)
        Kitronik_Robotics_Board.servoWrite(Kitronik_Robotics_Board.Servos.Servo2, SERVO_CALIBRATE2 + direction)
        Kitronik_Robotics_Board.servoWrite(Kitronik_Robotics_Board.Servos.Servo3, SERVO_CALIBRATE3 - innerDirection)
        Kitronik_Robotics_Board.servoWrite(Kitronik_Robotics_Board.Servos.Servo4, SERVO_CALIBRATE4 - direction)
    }
}
function straight() {
    turn(0)
}
function rotate() {
    Kitronik_Robotics_Board.servoWrite(Kitronik_Robotics_Board.Servos.Servo1, SERVO_CALIBRATE1 + 45)
    Kitronik_Robotics_Board.servoWrite(Kitronik_Robotics_Board.Servos.Servo2, SERVO_CALIBRATE2 - 45)
    Kitronik_Robotics_Board.servoWrite(Kitronik_Robotics_Board.Servos.Servo3, SERVO_CALIBRATE3 - 45)
    Kitronik_Robotics_Board.servoWrite(Kitronik_Robotics_Board.Servos.Servo4, SERVO_CALIBRATE4 + 45)
    if (!rotateMode) {
        basic.pause(150)
    }
    rotateMode = true
}
function stop() {
    rotateMode = false
    speed = 0
    targetSpeed = 0
    Kitronik_Robotics_Board.motorOn(Kitronik_Robotics_Board.Motors.Motor1, motorDirection, speed)
    Kitronik_Robotics_Board.motorOn(Kitronik_Robotics_Board.Motors.Motor2, motorDirection, speed)
    Kitronik_Robotics_Board.motorOn(Kitronik_Robotics_Board.Motors.Motor3, motorDirection, speed)
    Kitronik_Robotics_Board.motorOn(Kitronik_Robotics_Board.Motors.Motor4, motorDirection, speed)
}
function drive(drivespeed: number, forward: boolean) {
    targetSpeed = drivespeed
    if (forward) {
        if (motorDirection != Kitronik_Robotics_Board.MotorDirection.Forward) {
            speed = 0
        }
        motorDirection = Kitronik_Robotics_Board.MotorDirection.Forward
    } else {
        if (motorDirection != Kitronik_Robotics_Board.MotorDirection.Reverse) {
            speed = 0
        }
        motorDirection = Kitronik_Robotics_Board.MotorDirection.Reverse
    }
}
bluetooth.onBluetoothConnected(() => {
    isConnected = true
    stop();
})
bluetooth.onBluetoothDisconnected(() => {
    isConnected = false
    stop();
    control.reset();
})
bluetooth.onUartDataReceived(serial.delimiters(Delimiters.NewLine), () => {
    isConnected = true;
    motorTargetSpeeds[0] = parseInt(bluetooth.uartReadUntil(serial.delimiters(Delimiters.Comma)));
    motorTargetSpeeds[1] = parseInt(bluetooth.uartReadUntil(serial.delimiters(Delimiters.Comma)));
    servoTargetValue = parseInt(bluetooth.uartReadUntil(serial.delimiters(Delimiters.NewLine)));
})

let motorStamps: number[] = [0, 0];
let motorInterval: number = 50;
let stepThreshold = 200;
function updateMotors() {
    let now = input.runningTime();

    if (motorTargetSpeeds[0] == motorTargetSpeeds[1]) {
        rotateMode = false
        targetSpeed = Math.abs(motorTargetSpeeds[0])
        if (Math.abs(motorTargetSpeeds[0]) == motorTargetSpeeds[0]) {
            motorDirection = Kitronik_Robotics_Board.MotorDirection.Forward
        } else {
            motorDirection = Kitronik_Robotics_Board.MotorDirection.Reverse
        }
        straight()
    } else if (Math.abs(motorTargetSpeeds[0]) == Math.abs(motorTargetSpeeds[1])) {
        //rotateMode = true
        rotate()
        targetSpeed = Math.abs(motorTargetSpeeds[0])
        if (Math.abs(motorTargetSpeeds[0]) == motorTargetSpeeds[0]) {
            motorDirection = Kitronik_Robotics_Board.MotorDirection.Forward
        } else {
            motorDirection = Kitronik_Robotics_Board.MotorDirection.Reverse
        }
    } else { //if (motorTargetSpeeds[0] == 0 || motorTargetSpeeds[1] == 0) {
        let highestSpeed = Math.max(Math.abs(motorTargetSpeeds[0]), Math.abs(motorTargetSpeeds[1]))
        let lowestSpeed = Math.min(Math.abs(motorTargetSpeeds[0]), Math.abs(motorTargetSpeeds[1]))
        let turnAngle = Math.map((highestSpeed - lowestSpeed) / highestSpeed, 0, 1, 0, 25)
        targetSpeed = highestSpeed
        if (motorTargetSpeeds[0] < motorTargetSpeeds[1]) {
            turnAngle = -1 * turnAngle
        }
        if (Math.max(Math.abs(motorTargetSpeeds[0]), Math.abs(motorTargetSpeeds[1])) == Math.max(motorTargetSpeeds[0], motorTargetSpeeds[1])) {
            motorDirection = Kitronik_Robotics_Board.MotorDirection.Forward
        } else {
            motorDirection = Kitronik_Robotics_Board.MotorDirection.Reverse
        }
        turn(turnAngle)
    }

    speed += (targetSpeed - speed) / 2
    // if (speed < targetSpeed) {
    //     speed += 1
    // } else if (speed > targetSpeed) {
    //     speed += 0 - 1
    // }
    if (rotateMode) {
        if (motorDirection == Kitronik_Robotics_Board.MotorDirection.Forward) {
            oppositeMotorDirection = Kitronik_Robotics_Board.MotorDirection.Reverse
        } else {
            oppositeMotorDirection = Kitronik_Robotics_Board.MotorDirection.Forward
        }
        Kitronik_Robotics_Board.motorOn(Kitronik_Robotics_Board.Motors.Motor1, motorDirection, speed)
        Kitronik_Robotics_Board.motorOn(Kitronik_Robotics_Board.Motors.Motor2, oppositeMotorDirection, speed)
        Kitronik_Robotics_Board.motorOn(Kitronik_Robotics_Board.Motors.Motor3, motorDirection, speed)
        Kitronik_Robotics_Board.motorOn(Kitronik_Robotics_Board.Motors.Motor4, oppositeMotorDirection, speed)
    } else {
        Kitronik_Robotics_Board.motorOn(Kitronik_Robotics_Board.Motors.Motor1, motorDirection, speed)
        Kitronik_Robotics_Board.motorOn(Kitronik_Robotics_Board.Motors.Motor2, motorDirection, speed)
        Kitronik_Robotics_Board.motorOn(Kitronik_Robotics_Board.Motors.Motor3, motorDirection, speed)
        Kitronik_Robotics_Board.motorOn(Kitronik_Robotics_Board.Motors.Motor4, motorDirection, speed)
    }
}

let servoStamp = 0
let servoInterval = 150
let currentServoValue = servoValue

bluetooth.startUartService()
control.inBackground(() => {
    while (true) {
        updateMotors();
        if (input.runningTime() - servoStamp > servoInterval) {
            servoStamp = input.runningTime();
            // slowly go towards the target servo value
            servoValue = servoValue * (1 - SERVO_Q) + servoTargetValue * SERVO_Q;
            if (Math.abs(currentServoValue - servoValue) > 1) {
                currentServoValue = servoValue;
                Kitronik_Robotics_Board.servoWrite(Kitronik_Robotics_Board.Servos.Servo5, currentServoValue)
            }
        }
        basic.pause(10)
    }
})