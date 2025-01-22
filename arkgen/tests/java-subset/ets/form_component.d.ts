declare interface FormComponentInterface { 
    (): FormComponentAttribute
}

declare class FormComponentAttribute extends CommonMethod<FormComponentAttribute> {

   //~ size(value: { width: number; height: number }): FormComponentAttribute;
}

declare const FormComponent: FormComponentInterface
