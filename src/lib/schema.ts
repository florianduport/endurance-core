import * as enduranceModelType from '@typegoose/typegoose';
import { Types } from 'mongoose';
import { enduranceEmitter } from './emitter.js';

const EnduranceModelType = {
    ...enduranceModelType,
    Types
};

@EnduranceModelType.pre('save', function (this: any) {
    enduranceEmitter.emit(`${this.constructor.name}:preSave`, this);
})

@EnduranceModelType.modelOptions({ schemaOptions: { timestamps: true } })

export abstract class EnduranceSchema {
    @EnduranceModelType.prop({ type: () => EnduranceModelType.Types.ObjectId, auto: true })
    public _id!: Types.ObjectId;

    private static _model: any;

    static getModel() {
        if (!this._model) {
            this._model = EnduranceModelType.getModelForClass(this as any);
        }
        return this._model;
    }
}

export { EnduranceModelType };
