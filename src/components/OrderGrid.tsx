import { AnimatePresence } from 'framer-motion';
import { Order } from '@/types';
import { OrderCard } from './OrderCard';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import React, { useState, useEffect } from 'react';

interface OrderGridProps {
    orders: Order[];
    onDone: (orderId: string) => void;
    onReopen: (orderId: string) => void;
    onCardClick: (order: Order) => void;
    pendingCompletion: Map<string, NodeJS.Timeout>;
    completedTickets: Set<string>;
}

interface SortableOrderCardProps extends OrderGridProps {
    order: Order;
}

const SortableOrderCard = ({ order, onDone, onReopen, onCardClick, pendingCompletion, completedTickets }: SortableOrderCardProps) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: order.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <OrderCard
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            order={order}
            onDone={onDone}
            onReopen={onReopen}
            onCardClick={onCardClick}
            isPending={pendingCompletion.has(order.id)}
            isCompleted={completedTickets.has(order.id)}
        />
    );
};

export const OrderGrid = ({ orders: initialOrders, onDone, onReopen, onCardClick, pendingCompletion, completedTickets }: OrderGridProps) => {
    const [orders, setOrders] = useState<Order[]>(initialOrders);

    useEffect(() => {
        setOrders(initialOrders);
    }, [initialOrders]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor)
    );

    const handleDragEnd = (event: any) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            setOrders((items) => {
                const oldIndex = items.findIndex(item => item.id === active.id);
                const newIndex = items.findIndex(item => item.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleCardClick = (order: unknown) => {
        // Implementation of handleCardClick
    };

    return (
        <DndContext 
            sensors={sensors} 
            collisionDetection={closestCenter} 
            onDragEnd={handleDragEnd}
        >
            <SortableContext 
                items={orders.map(order => order.id)}
                strategy={verticalListSortingStrategy}
            >
                <div className="flex flex-row items-start gap-4 overflow-x-auto overflow-y-hidden p-4 bg-[var(--background-dark)]">
                    <AnimatePresence>
                        {orders.map((order, idx) => (
                            <SortableOrderCard
                                key={order.id && order.id !== '' ? order.id : `order-${idx}`}
                                order={order}
                                onDone={onDone}
                                onReopen={onReopen}
                                onCardClick={onCardClick}
                                pendingCompletion={pendingCompletion}
                                isCompleted={completedTickets.has(order.id)}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            </SortableContext>
        </DndContext>
    );
}; 