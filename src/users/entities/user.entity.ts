import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { GENDER, USER_ROLES } from '../enums/enums';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  firstName: string;

  @Column({ nullable: false })
  lastName: string;

  @Column({ nullable: false, unique: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  imgUrl?: string;

  @Column({ nullable: true })
  imagekit_fileId?: string;

  @Column({ nullable: true })
  birthdate: Date;

  @Column({ nullable: true })
  headline?: string;

  @Column({ nullable: true })
  bio?: string;

  @Column({ nullable: true })
  country?: string;

  @Column({ nullable: true })
  state?: string;

  @Column({ nullable: true })
  website?: string;

  @Column({ nullable: true, type: 'enum', enum: GENDER })
  sex?: GENDER;

  @Column({ nullable: false, unique: true })
  username: string;

  @Column({ type: 'enum', enum: USER_ROLES, default: USER_ROLES.USER })
  user_role: USER_ROLES;

  @Column({ nullable: true, default: false })
  isLoggedIn?: boolean;

  @Column({ nullable: true })
  social_id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  async modifyUserName() {
    this.username = `@${this.username}`;
  }

  @BeforeUpdate()
  async updateUserName() {
    this.username = `@${this.username}`;
  }
}
