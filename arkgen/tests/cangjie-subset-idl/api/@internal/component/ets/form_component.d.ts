
interface FormCallbackInfo {

  id: number;
  idString: string;
}

declare interface FormComponentInterface {
    (): FormComponentAttribute
}

declare class FormComponentAttribute extends CommonMethod<FormComponentAttribute> {
    onAcquired(callback: Callback<FormCallbackInfo>): FormComponentAttribute;
}

declare const FormComponent: FormComponentInterface