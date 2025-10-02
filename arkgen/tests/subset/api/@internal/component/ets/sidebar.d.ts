
interface SideBarContainerInterface {
    (): SideBarContainerAttribute
}

declare class SideBarContainerAttribute extends CommonMethod<SideBarContainerAttribute> {
    minSideBarWidth(value: number): SideBarContainerAttribute;
    minSideBarWidth(value: Length): SideBarContainerAttribute;
}

//declare constSideBarContainer: SideBarContainerInterface;
//declare constSideBarContainerInstance: SideBarContainerAttribute;
