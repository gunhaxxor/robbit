import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const Schema = mongoose.Schema;

interface User {
  username: string,
  password: string,
  refreshTokenId: string,
}

interface UserDocument extends User, mongoose.Document {
  isValidPassword: (password: string) => Promise<boolean>;
}

const schemaFields: Record<keyof User, unknown>
 = {
   username: {
     type: String,
     required: true,
     unique: true,
   },
   password: {
     type: String,
     required: true,
   },
   refreshTokenId: {
     type: String,
   },
 };

const UserSchema = new Schema<User>(schemaFields);

UserSchema.pre<UserDocument>('save', async function(next) {
  // const user = this;
  if(this.isNew){
    const hash = await bcrypt.hash(this.password, 10);
    this.password = hash;
  }
  next();
});

UserSchema.method('isValidPassword', async function(this: UserDocument, password) {
  const compare = await bcrypt.compare(password, this.password);
  return compare;
});

const UserModel = mongoose.model<UserDocument>('user', UserSchema);
export default UserModel;