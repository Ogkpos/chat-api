import bcrypt from "bcrypt";

export class Password {
  static async hashPassword(password: string) {
    return bcrypt.hash(password, 12);
  }

  static async comparePassword(hashedPassword: string, newPassword: string) {
    return bcrypt.compare(newPassword, hashedPassword);
  }
}
