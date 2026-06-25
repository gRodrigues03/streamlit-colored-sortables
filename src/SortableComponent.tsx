import React, {ReactNode, useState, useEffect} from "react"
import ReactDOM from 'react-dom'
import {
  DndContext,
  useDroppable,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';

import {SortableItem} from "./SortableItem"


type Direction = 'horizontal' | 'vertical';

interface StreamlitArguments {
  direction?: Direction,
  items: ContainerDescription[],
  headers: string[],
}

interface ContainerDescription {
  item: string,
  header?: string,
}

interface ContainerDescriptionUnpivoted {
  header: string,
  items: string[]
}

interface ContainerProps {
  header: string,
  items: string[],
  direction?: Direction,
  width?: number,
  children?: ReactNode
}

function Container(props: ContainerProps) {
  const {setNodeRef} = useDroppable({
    id: props.header,
  });

  return (
    <div className="sortables__container" ref={setNodeRef} style={{width: props.width}}>
      {
        props.header ? (<div className="sortables__container-header">{props.header}</div>) : null
      }
      <SortableContext id={props.header} items={props.items} strategy={rectSortingStrategy}>
        <div className="sortables__container-body">
          {props.children}
        </div>
      </SortableContext>
    </div>
  )
}

interface SortableComponentProps {
  direction?: Direction,
  availableHeaders: string[],
  items: ContainerDescription[],
  setStateValue: Function
}

function SortableComponent(props: SortableComponentProps) {
  const groupedItems: Record<string, string[]> = {};
  props.items.forEach(({item, header}) => {
    const key = header ?? "";
    if (!groupedItems[key]) {
      groupedItems[key] = [];
    }
    groupedItems[key].push(item);
  });

  let containers = Object.entries(groupedItems).map(([header, items]) => ({
    header,
    items
  }));

  const availableHeaders = [
    ...props.availableHeaders,
    ...containers
      .map(({header}) => header)
      .filter(header => !props.availableHeaders.includes(header))
  ];

  const groupedItemsMap = new Map<string, string[]>();

  containers.forEach(({header, items}) => {
    groupedItemsMap.set(header, items);
  });

  containers = availableHeaders.map(header => ({
    header,
    items: groupedItemsMap.get(header) ?? []
  }));

  const [items, setItems] = useState(containers);
  const [clonedItems, setClonedItems] = useState(containers);
  const [activeItem, setActiveItem] = useState(null);

  // Sync state up to Streamlit when container layout transforms
  useEffect(() => {
    const pivotedItems = items.flatMap(({header, items}) =>
      items.map(item => ({item, header}))
    );
    props.setStateValue('data', pivotedItems);
  }, [items]);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  return (
    <DndContext
      sensors={sensors}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragStart={handleDragStart}
      onDragCancel={handleDragCancel}
    >
      {
        items.map(({header, items}) => {
          return (
            <Container key={header} header={header} items={items} direction={props.direction}>
              {
                items.map(item => (
                  <SortableItem
                    key={item}
                    id={item}
                    ghost={false}
                    isActive={item === activeItem}
                  >
                    {item}
                  </SortableItem>
                ))
              }
            </Container>
          )
        })
      }

      {ReactDOM.createPortal(
        <DragOverlay
          style={{
            zIndex: 9999991,
          }}
        >
          {activeItem ? (
            <SortableItem
              id={activeItem}
              ghost={true}
              isOverlay={true}
            >
              {activeItem}
            </SortableItem>
          ) : null}
        </DragOverlay>,
        document.body
      )}
    </DndContext>
  );

  function handleDragStart(event: any) {
    setActiveItem(event.active.id);
    setClonedItems(items);
  }

  function handleDragCancel() {
    setActiveItem(null);
    setItems(clonedItems);
  }

  function handleDragEnd(event: any) {
    setActiveItem(null);
    const {active, over} = event;
    if (!over) {
      return
    }

    const activeContainerIndex = findContainer(active.id);
    const overContainerIndex = findContainer(over.id);

    if (activeContainerIndex === overContainerIndex) {
      const container = items[activeContainerIndex];
      const activeItemIndex = container.items.indexOf(active.id);
      const overItemIndex = container.items.indexOf(over.id);

      const newItems = items.map(({header, items}, index) => {
        if (index === activeContainerIndex) {
          return {
            header: header,
            items: arrayMove(items, activeItemIndex, overItemIndex)
          }
        } else {
          return {
            header: header,
            items: items
          }
        }
      })

      if (!isSameOrder(clonedItems, newItems)) {
        setItems(newItems);
      }
    }
  }

  function handleDragOver(event: any) {
    const {active, over} = event;

    if (!over) {
      return
    }
    const activeContainerIndex = findContainer(active.id);
    const overContainerIndex = findContainer(over.id);
    if (overContainerIndex < 0) {
      return;
    }

    if (activeContainerIndex === overContainerIndex) {
      return
    }

    const activeItemIndex = items[activeContainerIndex].items.indexOf(active.id);
    const activeItem = items[activeContainerIndex].items[activeItemIndex];
    const newItems = items.map(({header, items}, index) => {
      if (index === activeContainerIndex) {
        return {
          header: header,
          items: [...items.slice(0, activeItemIndex), ...items.slice(activeItemIndex + 1)]
        }
      } else if (index === overContainerIndex) {
        return {
          header: header,
          items: [...items.slice(0, activeItemIndex), activeItem, ...items.slice(activeItemIndex)]
        }
      } else {
        return {
          header: header,
          items: items
        }
      }
    })
    setItems(newItems);
  }

  function findContainer(item: string) {
    const containerIndex = items.findIndex(({header}) => header === item);
    if (containerIndex >= 0) {
      return containerIndex;
    }
    return items.findIndex(({items}) => items.includes(item));
  }

  function isSameOrder(items1: ContainerDescriptionUnpivoted[], items2: ContainerDescriptionUnpivoted[]) {
    if (items1.length !== items2.length) {
      return false;
    }

    return items1.every(({header, items}, index) => {
      const container2 = items2[index];
      if (header !== container2.header) {
        return false;
      }
      return items.every((item, index) => {
        return item === container2.items[index];
      });
    })
  }
}

export default function SortableComponentWrapper(props: { data: StreamlitArguments; setStateValue: Function }) {
  const args: StreamlitArguments = props.data;
  const items = args.items;
  const headers = args.headers;
  const className = 'sortables-root ' + args.direction;
  return (
    <div className={className}>
      <SortableComponent items={items} availableHeaders={headers} direction={args.direction} setStateValue={props.setStateValue}/>
    </div>
  )
}