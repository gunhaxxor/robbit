basic.showLeds(`
    . . . . .
    # . # . #
    # # # . #
    # . # . #
    . . . . .
    `)
// basic.clearScreen()


let SERVO_PIN = AnalogPin.P13
let SERVO_START_VALUE = 90
let SERVO_MAX_VALUE = 100
let SERVO_MIN_VALUE = 20
let SERVO_Q = 0.3
let MOTOR_RECEIVED_MAX = 1000;
let receivedValues: number[] = [0, 0, 150]
let radioStamp = 0
let currentMotorValues: number[] = [0, 0];
let previousMotorValues: number[] = [0, 0];
let motorTargetSpeeds: number[] = [0, 0];
let isConnected = false
let servoValue = SERVO_START_VALUE
let servoTargetValue = SERVO_START_VALUE

bluetooth.startUartService()

input.onButtonPressed(Button.A, () => {
    servoTargetValue = SERVO_START_VALUE
    servoValue = SERVO_START_VALUE
})
input.onButtonPressed(Button.B, () => {
    servoTargetValue = SERVO_MIN_VALUE
    servoValue = SERVO_MIN_VALUE
})
input.onButtonPressed(Button.AB, () => {
    setMotorPwm(0, 0);
    setMotorPwm(1, 0);
})
bluetooth.onBluetoothConnected(() => {
    isConnected = true
    setMotorPwm(0, 0);
    setMotorPwm(1, 0);
    basic.showIcon(IconNames.Yes)
    basic.clearScreen()
})
bluetooth.onBluetoothDisconnected(() => {
    isConnected = false
    setMotorPwm(0, 0);
    setMotorPwm(1, 0);
    basic.showIcon(IconNames.No)
    basic.clearScreen()

    control.reset();
})
bluetooth.onUartDataReceived(serial.delimiters(Delimiters.NewLine), () => {
    isConnected = true;
    led.plot(4, 0);
    radioStamp = input.runningTime()
    receivedValues = []
    //we expect 3 values!
    for (let i = 0; i < 2; i++) {
        receivedValues[i] = parseInt(bluetooth.uartReadUntil(serial.delimiters(Delimiters.Comma)));
    }
    receivedValues[2] = parseInt(bluetooth.uartReadUntil(serial.delimiters(Delimiters.NewLine)));

    // receivedString = bluetooth.uartReadUntil(serial.delimiters(Delimiters.Comma))
    // receivedString = bluetooth.uartReadUntil(serial.delimiters(Delimiters.NewLine))
    // serial.writeLine(receivedString);
    // receivedStrings = split(receivedString, ";");
    // for (let i = 0; i <= receivedStrings.length - 1; i++) {
    //     receivedValues.push(parseInt(receivedStrings[i]))
    // }

    // serial.writeNumbers(receivedValues);

    motorTargetSpeeds[0] = receivedValues[0];
    motorTargetSpeeds[1] = receivedValues[1];
    servoTargetValue = receivedValues[2]
})

let motorStamps: number[] = [0, 0];
let motorInterval: number = 50;
let stepThreshold = 200;
function updateMotors() {
    let now = input.runningTime();
    for (let i = 0; i < 2; i++) {

        let onDuration = Math.map(Math.abs(motorTargetSpeeds[i]), 0, stepThreshold, 0, motorInterval);
        if (now - motorStamps[i] <= onDuration) {
            if (Math.abs(motorTargetSpeeds[i]) < stepThreshold) {
                setMotorPwm(i, Math.sign(motorTargetSpeeds[i] * 10));
                led.plot(1 + 2 * i, 2);
            } else {
                let rescaledMotorValue = Math.sign(motorTargetSpeeds[i]) * Math.map(Math.abs(motorTargetSpeeds[i]), stepThreshold, 1000, 0, 1000);
                setMotorPwm(i, rescaledMotorValue);
                led.plot(1 + 2 * i, 3);
            }


        } else {
            // let scaledMotorValue = Math.map(motorTargetSpeeds[i], 0, , 0, 4)
            setMotorPwm(i, 0);
            led.unplot(1 + 2 * i, 3);
        }

        if (now - motorStamps[i] > motorInterval) {
            motorStamps[i] = now;
            // led.plot(1 + 2 * i, 3);
        }
    }


    // setMotorPwm(1, motorTargetSpeeds[1]);
    // setMotorPwm(0, motorTargetSpeeds[0]);
}

let minMotorPowerAtLowBatteryVoltage = 36;
let minMotorPowerAtHighBatteryVoltage = 25;
let batteryVoltage = 4200;
let minMotorPower = 30

// Sets the motor speed. Expects values between -1000 and 1000
function setMotorPwm(motor: number, value: number) {
    if (value == undefined) {
        return;
    }

    previousMotorValues[motor] = currentMotorValues[motor];
    currentMotorValues[motor] = value;
    let currentDirection = -1 * Math.sign(currentMotorValues[motor]);
    let previousDirection = -1 * Math.sign(previousMotorValues[motor]);

    //Check if we need to force kick the motor to move with a slightly higher initial voltage
    //Should be true if the motor was still or if it was previously moving the other direction 
    let needsInitialPush = currentDirection != 0 && currentDirection != previousDirection;
    if (needsInitialPush) {
        led.plot(3, 0);
    }
    let activeMotor: number;
    if (motor == 0) {
        activeMotor = gigglebotWhichMotor.Right;
    } else {
        activeMotor = gigglebotWhichMotor.Left;
    }

    if (false && needsInitialPush) {
        gigglebot.motorPowerAssign(activeMotor, currentDirection * 50);
        basic.pause(15);
    }
    gigglebot.motorPowerAssign(activeMotor, currentDirection * Math.map(Math.abs(value), 0, MOTOR_RECEIVED_MAX, minMotorPower, 100));
    // gigglebot.motorPowerAssign(activeMotor, Math.constrain(value / -10, -100, 100))
}

// function split(inputString: string, delimiter: string): Array<string> {
//     let splittedStrings: string[] = [];
//     let prevDelimiterIndex = 0;
//     for (let index = 0; index <= inputString.length; index++) {
//         if (inputString.charAt(index) == delimiter) {
//             splittedStrings.push(
//                 inputString.substr(prevDelimiterIndex, index - prevDelimiterIndex)
//             );
//             prevDelimiterIndex = index + 1;
//         }
//     }
//     splittedStrings.push(
//         inputString.substr(
//             prevDelimiterIndex,
//             inputString.length - prevDelimiterIndex
//         )
//     );
//     return splittedStrings;
// }

let servoStamp = 0
let servoInterval = 150
let currentServoValue = servoValue

let counter = 0;
control.inBackground(() => {
    while (true) {
        basic.clearScreen()

        batteryVoltage = gigglebot.voltageBattery();
        minMotorPower = Math.map(batteryVoltage, 3400, 4700, minMotorPowerAtLowBatteryVoltage, minMotorPowerAtHighBatteryVoltage);
        minMotorPower = Math.constrain(minMotorPower, minMotorPowerAtHighBatteryVoltage, minMotorPowerAtLowBatteryVoltage);

        updateMotors();

        // motorTargetSpeeds[0]++;
        // motorTargetSpeeds[0] %= 600;

        // motorTargetSpeeds[1]--;
        // motorTargetSpeeds[1] %= 600;

        if (input.runningTime() - servoStamp > servoInterval) {
            servoStamp = input.runningTime();
            // slowly go towards the target servo value
            servoValue = servoValue * (1 - SERVO_Q) + servoTargetValue * SERVO_Q;
            if (Math.abs(currentServoValue - servoValue) > 1) {
                currentServoValue = servoValue;
                led.plot(0, 4);
                pins.servoWritePin(SERVO_PIN, currentServoValue);
            }

            // setMotorPwm(0, counter++);
            // counter %= 1000;
        }

        if (isConnected) {
            // updateMotors();
            // setMotorPwm(0, receivedValues[0]);
            // setMotorPwm(1, receivedValues[1]);
            led.plot(0, pins.map(
                currentMotorValues[0],
                -500,
                500,
                4,
                0
            ))
            led.plot(4, pins.map(
                currentMotorValues[1],
                -500,
                500,
                4,
                0
            ))
            led.plot(2, pins.map(
                servoValue,
                75,
                150,
                4,
                0
            ))
        }
        else {
            // basic.showIcon(IconNames.Asleep, 1);
        }
        // if (input.runningTime() - radioStamp > 1000) {
        //     setMotorPwm(0, 0);
        //     setMotorPwm(1, 0);
        // }
        basic.pause(5)
        led.plot(0, 0);
        basic.pause(5);

    }
}) 