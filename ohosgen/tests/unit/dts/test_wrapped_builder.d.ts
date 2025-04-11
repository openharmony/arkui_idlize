
// TBD: use declare instead of export
export interface CustomComponentShape {
  shapeStyle: number
}

export interface CustomComponentConfiguration extends CommonConfiguration {

  name: string;
  selected: boolean;
  triggerChange: Callback<boolean>;
}

export class CustomComponentSample {

  contentModifier(modifier: ContentModifier<CustomComponentConfiguration>): CustomComponentSample;
  // getContentModifier(): ContentModifier;

  // getSample(val: any): any
}
