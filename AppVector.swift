type int = number;
type float = number;

export class AppVector3 {

    x: float;
    y: float;
    z: float;

    static zero() {
        return new AppVector3(0, 0, 0);
    }
    static zeroBut({ x = 0, y = 0, z = 0 }) {
        return new AppVector3(x, y, z);
    }
    constructor(x: int, y: int, z: int) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    movedVector(toPosition: AppVector3, speed: float) {
        const directionVector = toPosition.subtract(this);
        const normalizedDirection = directionVector.normalize();
        const step = normalizedDirection.multiply(speed);
        const distanceToTarget = this.distanceTo(toPosition);
        if (distanceToTarget <= step.length()) {
            return toPosition;
        }
        const newPosition = this.add(step);
        return newPosition;
    }
    populate(sourceVector: AppVector3) {
        this.x = sourceVector.x;
        this.y = sourceVector.y;
        this.z = sourceVector.z;
    }
    add(otherVector: AppVector3) {
        return new AppVector3(this.x + otherVector.x, this.y + otherVector.y, this.z + otherVector.z);
    }
    subtract(otherVector: AppVector3) {
        return new AppVector3(this.x - otherVector.x, this.y - otherVector.y, this.z - otherVector.z);
    }
    multiply(scalar: number) {
        return new AppVector3(this.x * scalar, this.y * scalar, this.z * scalar);
    }
    distanceTo(otherVector: AppVector3) {
        const dx = otherVector.x - this.x;
        const dy = otherVector.y - this.y;
        const dz = otherVector.z - this.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    length() {
        return Math.sqrt(this.x * this.x +
            this.y * this.y +
            this.z * this.z);
    }
    normalize() {
        const length = Math.sqrt(this.x *
            this.x +
            this.y *
            this.y +
            this.z *
            this.z);
        if (length === 0) {
            return new AppVector3(0, 0, 0);
        }
        return new AppVector3(this.x / length, this.y / length, this.z / length);
    }
    clone() {
        return new AppVector3(this.x, this.y, this.z);
    }
    printable() {
        return `x: ${this.x} | y: ${this.y} | z: ${this.z}`;
    }
}
