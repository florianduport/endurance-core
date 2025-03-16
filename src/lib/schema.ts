import { getModelForClass, pre, prop } from '@typegoose/typegoose';
import { enduranceEmitter } from './emitter.js';

@pre('save', function (this: any) {
    enduranceEmitter.emit(`${this.constructor.name}:preSave`, this);
})
export abstract class EnduranceSchema {
    @prop({ default: () => new Date() })
    public createdAt!: Date;

    @prop({ default: () => new Date() })
    public updatedAt!: Date;

    private static _model: any;

    preSave(): void {
        enduranceEmitter.emit(`${this.constructor.name}:preSave`, this);
    }

    static getModel() {
        if (!this._model) {
            this._model = getModelForClass(this as any);
        }
        return this._model;
    }
}

export { prop, pre };
