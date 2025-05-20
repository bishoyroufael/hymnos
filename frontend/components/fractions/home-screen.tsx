import Card from "@components/base/Card";
import ToolBox from "@components/base/ToolBox";
import { FlatList } from "react-native";

export const renderSkeletons = () => {
  return (
    <>
      <Card isSkeleton />
      <Card isSkeleton />
      <Card isSkeleton />
    </>
  );
};

export const CreateOrUploadToolBox = ({ onAddCallback, onUploadCallback }) => {
  return (
    <ToolBox
      className="flex flex-row"
      showOnlyIf={true}
      actions={[
        {
          key: "add",
          iconName: "plus",
          iconClassName: "text-green-400 hover:text-green-500 duration-100",
          onPress: onAddCallback,
        },
        {
          key: "upload",
          iconName: "upload",
          iconClassName: "text-blue-500 hover:text-blue-600 duration-100",
          onPress: onUploadCallback,
        },
      ]}
    />
  );
};

interface HymnBase {
  uuid: string;
  title: string;
}

type HorizontalListProps<T extends HymnBase> = {
  data: T[];
  isLoading: boolean;
  renderCardDescription: (item: T) => string;
  onCardPress: (item: T) => void;
  skeletonElement: JSX.Element;
  emptyResultsElement: JSX.Element;
};

export function HorizontalHymnList<T extends HymnBase>({
  data,
  isLoading,
  renderCardDescription,
  onCardPress,
  skeletonElement,
  emptyResultsElement
}: HorizontalListProps<T>) {
  return (
    <FlatList
      ListEmptyComponent={isLoading ? skeletonElement: emptyResultsElement}
      className="no-scrollbar"
      contentContainerClassName="gap-4"
      data={data}
      inverted
      keyExtractor={(item) => item.uuid} // uuid must be defined
      horizontal
      renderItem={({ item }) => (
        <Card
          title={item.title}
          description={renderCardDescription(item)}
          onPressCallback={() => onCardPress(item)}
        />
      )}
    />
  );
}
