
declare class SubTabBarStyle {
}

declare class BottomTabBarStyle {
}

declare class TabContentAttribute extends CommonMethod<TabContentAttribute> {

    tabBar(value: SubTabBarStyle | BottomTabBarStyle): TabContentAttribute;
}