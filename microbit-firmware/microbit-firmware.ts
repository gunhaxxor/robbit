basic.showLeds(`
    . . . . .
    # . # . #
    # # # . #
    # . # . #
    . . . . .
    `)
// basic.clearScreen()


let SERVO_PIN = AnalogPin.P13
let SERVO_START_VALUE = 100
let SERVO_MAX_VALUE = 155
let SERVO_MIN_VALUE = 75
let SERVO_Q = 0.8
let MOTOR_RECEIVED_MAX = 1000;
let receivedValues: number[] = [0, 0, 150]
let radioStamp = 0
let currentMotorValues: number[] = [0, 0];
let previousMotorValues: number[] = [0, 0];
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

    servoTargetValue = receivedValues[2]
})

let minMotorPowerAtLowBatteryVoltage = 36;
let minMotorPowerAtHighBatteryVoltage = 25;
let batteryVoltage = 4200;
let minMotorPower = 30

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

    if (needsInitialPush) {
        gigglebot.motorPowerAssign(activeMotor, currentDirection * 50);
        basic.pause(15);
    }
    gigglebot.motorPowerAssign(activeMotor, currentDirection * Math.map(Math.abs(value), 0, MOTOR_RECEIVED_MAX, minMotorPower, 100));
    // gigglebot.motorPowerAssign(activeMotor, Math.constrain(value / -10, -100, 100))
}

function split(inputString: string, delimiter: string): Array<string> {
    let splittedStrings: string[] = [];
    let prevDelimiterIndex = 0;
    for (let index = 0; index <= inputString.length; index++) {
        if (inputString.charAt(index) == delimiter) {
            splittedStrings.push(
                inputString.substr(prevDelimiterIndex, index - prevDelimiterIndex)
            );
            prevDelimiterIndex = index + 1;
        }
    }
    splittedStrings.push(
        inputString.substr(
            prevDelimiterIndex,
            inputString.length - prevDelimiterIndex
        )
    );
    return splittedStrings;
}

control.inBackground(() => {
    while (true) {
        basic.clearScreen()
        // slowly go towards the target servo value
        servoValue = servoValue * SERVO_Q + servoTargetValue * (1 - SERVO_Q);

        batteryVoltage = gigglebot.voltageBattery();
        minMotorPower = Math.map(batteryVoltage, 3400, 4700, minMotorPowerAtLowBatteryVoltage, minMotorPowerAtHighBatteryVoltage);
        minMotorPower = Math.constrain(minMotorPower, minMotorPowerAtHighBatteryVoltage, minMotorPowerAtLowBatteryVoltage);

        pins.servoWritePin(SERVO_PIN, servoValue)

        if (isConnected) {
            setMotorPwm(0, receivedValues[0]);
            setMotorPwm(1, receivedValues[1]);
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
        if (input.runningTime() - radioStamp > 1000) {
            setMotorPwm(0, 0);
            setMotorPwm(1, 0);
        }
        basic.pause(10)
        led.plot(0, 0);
        basic.pause(10);
    }
}) 