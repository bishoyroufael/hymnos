import HymnosText from "@components/base/HymnosText";
import Feather from "@expo/vector-icons/Feather";
import React, { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, View, ViewProps } from "react-native";

interface MenuItem {
  title: string;
  onPress?: () => void;
  nestedMenu?: MenuProps;
  itemCustomView?: JSX.Element;
}

interface MenuProps extends ViewProps {
  title?: string;
  customView?: JSX.Element;
  items?: MenuItem[];
}

// Abstract menu to be used everywhere
export default function Menu({
  title,
  customView,
  items,
  className,
  ...rest
}: MenuProps) {
  const [menuStack, setMenuStack] = useState<number[]>([]); // stack of indices into items/nestedMenus

  // Traverse current path to get the active menu
  const activeMenu = useMemo(() => {
    let current: MenuProps = { title, customView, items };
    // console.log(menuStack);
    for (const index of menuStack) {
      const next = current.items?.[index]?.nestedMenu;
      if (!next) break;
      current = next;
    }
    return current;
  }, [title, customView, items, menuStack]);

  const renderItem = ({ item, index }) => {
    const isDisabled = !(item.nestedMenu || item.onPress);
    return (
      <Pressable
        disabled={isDisabled}
        key={item.title}
        className={`p-2 rounded-md flex-row items-center justify-between ${!isDisabled ? "hover:bg-slate-300 duration-200" : ""}`}
        onPress={() => {
          if (item.nestedMenu) {
            setMenuStack((prev) => [...prev, index]);
            return;
          }
          item.onPress?.();
        }}
      >
        <HymnosText className="text-gray-800">{item.title}</HymnosText>
        {item.itemCustomView}
        {item.nestedMenu && <Feather name="chevron-right" size={16} />}
      </Pressable>
    );
  };

  return (
    <View
      {...rest}
      className={`bg-slate-200 rounded-md p-2 flex flex-col gap-1 ${className}`}
    >
      <View className="flex-row flex items-center">
        {menuStack.length > 0 && (
          <Pressable
            onPress={() => {
              setMenuStack((prev) => prev.slice(0, -1));
            }}
          >
            <Feather name="arrow-left" size={20} />
          </Pressable>
        )}
        {activeMenu.title && (
          <HymnosText className="p-2 font-medium text-gray-800">
            {activeMenu.title}
          </HymnosText>
        )}
      </View>

      {activeMenu.title && <View className="border-b flex-1 bg-black" />}

      {activeMenu.customView || (
        <FlatList
          // className="overflow-y-auto"
          className="overflow-visible"
          data={activeMenu.items}
          keyExtractor={(item) => item.title}
          renderItem={renderItem}
        />
      )}
    </View>
  );
}
