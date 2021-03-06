import { Inject, Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { UserModel } from '../database/models/user.model';
import { ModelClass, transaction } from 'objection';
import { nanoid } from 'nanoid';
import * as argon2 from "argon2";

@Injectable()
export class UserService {
  constructor(@Inject('UserModel') private modelClass: ModelClass<UserModel>) { }

  findAll() {
    return this.modelClass.query();
  }

  findById(id: number) {
    return this.modelClass.query().findById(id);
  }

  findOne(props: Partial<UserModel>) {
    return this.modelClass.query().findOne(props);
  }

  async create(props: Partial<UserModel>) {
    const user = await this.modelClass.query().findOne({ 'email': props.email });
    if (user) {
      throw new HttpException('Forbidden', HttpStatus.CONFLICT);
    }
    const hash = await argon2.hash(props.password);
    props.password = hash;
    // TODO: send password via email
    return this.modelClass
      .query()
      .insert(props);
  }

  update(id: number, props: Partial<UserModel>) {
    return this.modelClass
      .query()
      .patch(props)
      .where({ id })
      .returning('*')
      .first();
  }

  delete(id: number) {
    return transaction(this.modelClass, async (_, trx) => {
      return this.modelClass
        .query()
        .delete()
        .where({ id })
        .returning('*')
        .first()
        .transacting(trx);
    });
  }
}
