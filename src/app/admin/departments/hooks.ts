"use client";

import { useState } from "react";
import { EntityMetrics, EntityDetail } from "./types";
import { MOCK_ENTITY_METRICS, MOCK_ENTITIES } from "./mockData";

export function useEntityMetrics() {
  const [metrics, setMetrics] = useState<EntityMetrics>(MOCK_ENTITY_METRICS);
  const [loading] = useState(false);

  return { metrics, loading, setMetrics };
}

export function useEntities() {
  const [entities, setEntities] = useState<EntityDetail[]>(MOCK_ENTITIES);
  const [selectedEntityId, setSelectedEntityId] = useState<string>(MOCK_ENTITIES[0]?.id || "");
  const [loading] = useState(false);

  const selectedEntity =
    entities.find((e) => e.id === selectedEntityId) || entities[0] || null;

  const toggleClearance = (
    entityId: string,
    key: keyof EntityDetail["clearances"]
  ) => {
    setEntities((prev) =>
      prev.map((entity) => {
        if (entity.id === entityId) {
          return {
            ...entity,
            clearances: {
              ...entity.clearances,
              [key]: !entity.clearances[key]
            }
          };
        }
        return entity;
      })
    );
  };

  const addEntity = (newEntity: EntityDetail) => {
    setEntities((prev) => [newEntity, ...prev]);
    setSelectedEntityId(newEntity.id);
  };

  const addDelegate = (entityId: string, delegate: EntityDetail["authorizedDelegates"][0]) => {
    setEntities((prev) =>
      prev.map((entity) => {
        if (entity.id === entityId) {
          return {
            ...entity,
            delegatesCount: entity.delegatesCount + 1,
            authorizedDelegates: [delegate, ...entity.authorizedDelegates]
          };
        }
        return entity;
      })
    );
  };

  return {
    entities,
    selectedEntity,
    selectedEntityId,
    setSelectedEntityId,
    toggleClearance,
    addEntity,
    addDelegate,
    loading
  };
}
