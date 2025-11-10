
interface FormCallbackInfo {

  id: number;
  idString: string;
}

declare interface FormComponentInterface {
    (): FormComponentAttribute
}

declare class FormComponentAttribute extends CommonMethod<FormComponentAttribute> {

    size(value: { width: number; height: number }): FormComponentAttribute;

    onAcquired(callback: Callback<FormCallbackInfo>): FormComponentAttribute;
}

declare const FormComponent: FormComponentInterface