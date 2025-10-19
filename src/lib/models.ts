import { ObjectId } from 'mongodb';

export interface User {
  _id?: ObjectId;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  password: string;
  role: 'admin' | 'user';
  createdAt: Date;
  updatedAt: Date;
}

export interface Dispatch {
  _id?: ObjectId;
  userId: ObjectId;
  dispatchedKg: number;
  dispatchDate: Date;
  dispatchNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Employee {
  _id?: ObjectId;
  name: string;
  specialNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkRecord {
  _id?: ObjectId;
  employeeId: ObjectId;
  kilograms: number;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  _id?: ObjectId;
  employeeId: ObjectId;
  amount: number;
  status: 'PENDING' | 'PAID';
  createdAt: Date;
  paidAt?: Date;
}

export interface Configuration {
  _id?: ObjectId;
  key: string;
  value: string;
  createdAt: Date;
  updatedAt: Date;
}
