import { draggable, dropTargetForElements, monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { attachClosestEdge, extractClosestEdge, type Edge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { appState } from '../core/app.svelte';
import type { Action } from 'svelte/action';

type DragData = { type: 'site' | 'group', id: string, groupId?: string, enabled?: boolean };
type DropData = { type: 'site' | 'group', id?: string, groupId?: string, isAddButton?: boolean };

export const pdndDraggable: Action<HTMLElement, DragData> = (node, data) => {
    let currentData = data;

    const cleanup = draggable({
        element: node,
        getInitialData: () => ({ ...currentData, type: currentData.type }),
        canDrag: () => currentData.enabled !== false, 
        onDragStart: () => {
           document.body.setAttribute('data-dragging', 'true');
           if (currentData.type === 'site') {
               node.classList.add('opacity-20');
           }
        },
        onDrop: () => {
           document.body.removeAttribute('data-dragging');
           node.classList.remove('opacity-20');
        }
    });

    return { 
        update(newData) {
            currentData = newData;
        },
        destroy: cleanup 
    };
};

export const pdndDropTarget: Action<HTMLElement, DropData> = (node, data) => {
    const cleanup = dropTargetForElements({
        element: node,
        getData: ({ input, element }) => {
            return attachClosestEdge(data, {
                element,
                input,
                allowedEdges: data.type === 'group' ? ['top', 'bottom'] : ['left', 'right']
            });
        },
        onDragEnter: () => {
            if (appState.isEditMode) node.setAttribute('data-drag-over', 'true');
        },
        onDragLeave: () => {
            node.removeAttribute('data-drag-over');
        },
        onDrop: () => {
            node.removeAttribute('data-drag-over');
        }
    });
    return { destroy: cleanup };
};

export function initDnDMonitor(
    callbacks: { 
        onMoveItem: (itemId: string, targetGroupId: string, targetIndex: number, edge: Edge | null) => void,
        onMoveToGroupEnd: (itemId: string, targetGroupId: string) => void,
        onMoveGroup: (sourceGroupId: string, targetGroupId: string, edge: Edge | null) => void
    }
) {
    return monitorForElements({
        onDrop({ source, location }) {
            const target = location.current.dropTargets[0];
            if (!target) return;

            const sourceData = source.data as DragData;
            const targetData = target.data as DropData;

            if (sourceData.type === 'group' && targetData.type === 'group') {
                if (sourceData.id === targetData.id) return;
                const edge = extractClosestEdge(targetData);
                callbacks.onMoveGroup(sourceData.id, targetData.id as string, edge);
                return;
            }

            if (sourceData.type === 'site') {
                if (targetData.isAddButton) {
                    if (sourceData.groupId !== targetData.groupId) {
                        callbacks.onMoveToGroupEnd(sourceData.id, targetData.groupId as string);
                    }
                    return;
                }

                if (targetData.type === 'site' && targetData.id) {
                    if (sourceData.id === targetData.id) return;
                    
                    const edge = extractClosestEdge(targetData);
                    callbacks.onMoveItem(sourceData.id, targetData.groupId, targetData.id, edge);
                }
            }
        }
    });
}