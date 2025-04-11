<template>
  <div class="slide-editor">
    <div v-if="!slideData" class="slide-editor-empty">
      <p>Aucune diapositive sélectionnée</p>
    </div>
    <div v-else class="slide-editor-canvas">
      <v-stage
        ref="stage"
        :config="stageConfig"
        @mousedown="handleMouseDown"
        @touchstart="handleMouseDown"
      >
        <!-- Fond de la diapositive -->
        <v-layer>
          <v-rect
            :config="{
              x: 0,
              y: 0,
              width: stageConfig.width,
              height: stageConfig.height,
              fill: slideData.background?.color || '#FFFFFF',
              name: 'background'
            }"
          />
        </v-layer>
        
        <!-- Couche principale pour les éléments -->
        <v-layer ref="elementsLayer">
          <!-- Éléments texte -->
          <v-text
            v-for="(element, index) in textElements"
            :key="element.id"
            :config="{
              x: element.position.x,
              y: element.position.y,
              width: element.position.width,
              height: element.position.height,
              text: element.text,
              fontSize: element.style?.fontSize || 16,
              fontFamily: element.style?.fontFamily || 'Arial',
              fill: element.style?.color || '#000000',
              fontStyle: getTextStyle(element),
              align: element.style?.align || 'left',
              draggable: true,
              id: element.id
            }"
            @dragend="handleTextDragEnd($event, element.id)"
            @transformend="handleTextTransformEnd($event, element.id)"
            @dblclick="openTextDialog(element)"
            @click="selectElement(element.id)"
          />
          
          <!-- Éléments image -->
          <v-image
            v-for="element in imageElements"
            :key="element.id"
            :config="{
              x: element.position.x,
              y: element.position.y,
              width: element.position.width,
              height: element.position.height,
              image: loadedImages[element.id],
              draggable: true,
              id: element.id
            }"
            @dragend="handleImageDragEnd($event, element.id)"
            @click="selectElement(element.id)"
          />
          
          <!-- Éléments forme -->
          <component
            v-for="element in shapeElements"
            :key="element.id"
            :is="getShapeComponent(element.shapeType)"
            :config="getShapeConfig(element)"
            @dragend="handleShapeDragEnd($event, element.id)"
            @click="selectElement(element.id)"
          />
        </v-layer>
        
        <!-- Couche de sélection -->
        <v-layer ref="selectionLayer">
          <v-transformer
            v-if="selectedElementId && !showTextDialog"
            ref="transformer"
            :config="{
              enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
              rotateEnabled: false,
              borderStroke: '#1890FF',
              borderStrokeWidth: 2,
              anchorStroke: '#1890FF',
              anchorFill: '#FFFFFF',
              anchorSize: 10,
              keepRatio: false,
              boundBoxFunc: (oldBox, newBox) => {
                // Limite minimale pour le redimensionnement
                if (newBox.width < 10 || newBox.height < 10) {
                  return oldBox;
                }
                return newBox;
              }
            }"
          />
        </v-layer>
      </v-stage>

      <!-- Dialogue d'édition de texte -->
      <div v-if="showTextDialog" class="text-dialog-overlay" @click.self="closeTextDialog">
        <div class="text-dialog">
          <h3>Modifier le texte</h3>
          <input 
            ref="textInput" 
            v-model="editedText" 
            type="text" 
            class="text-input"
            @keyup.enter="saveTextChanges"
            @keyup.esc="closeTextDialog"
          />
          <div class="dialog-buttons">
            <button class="save-btn" @click="saveTextChanges">Enregistrer</button>
            <button class="cancel-btn" @click="closeTextDialog">Annuler</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { usePresentationStore } from '@/stores/presentation';

export default {
  name: 'SlideEditor',
  
  props: {
    slideData: {
      type: Object,
      required: true
    },
    width: {
      type: Number,
      default: 800
    },
    height: {
      type: Number,
      default: 450
    }
  },
  
  setup(props, { emit }) {
    const presentationStore = usePresentationStore();
    
    // Références aux éléments Konva
    const stage = ref(null);
    const elementsLayer = ref(null);
    const selectionLayer = ref(null);
    const transformer = ref(null);
    const textInput = ref(null);
    
    // État local
    const selectedElementId = ref(null);
    const loadedImages = ref({});
    const showTextDialog = ref(false);
    const editedText = ref('');
    const currentEditingElement = ref(null);
    
    // Configuration du stage
    const stageConfig = computed(() => ({
      width: props.width,
      height: props.height,
      draggable: false
    }));
    
    // Filtrer les éléments par type
    const textElements = computed(() => 
      props.slideData?.elements?.filter(el => el.type === 'text') || []
    );
    
    const imageElements = computed(() => 
      props.slideData?.elements?.filter(el => el.type === 'image') || []
    );
    
    const shapeElements = computed(() => 
      props.slideData?.elements?.filter(el => el.type === 'shape') || []
    );
    
    // Sélectionner un élément
    const selectElement = (elementId) => {
      if (showTextDialog.value) return;
      
      selectedElementId.value = elementId;
      
      // Attendre que les composants Konva soient montés
      setTimeout(() => {
        // Mettre à jour le transformer pour l'élément sélectionné
        if (transformer.value && stage.value) {
          try {
            const stageNode = stage.value.getNode();
            if (!stageNode) return;
            
            const node = stageNode.findOne(`#${elementId}`);
            if (node) {
              const transformerNode = transformer.value.getNode();
              if (transformerNode) {
                transformerNode.nodes([node]);
                transformerNode.getLayer().batchDraw();
              }
            }
          } catch (error) {
            console.error('Erreur lors de la sélection:', error);
          }
        }
      }, 50);
    };
    
    // Désélectionner un élément
    const deselectElement = () => {
      if (showTextDialog.value) return;
      
      selectedElementId.value = null;
      setTimeout(() => {
        if (transformer.value) {
          try {
            const transformerNode = transformer.value.getNode();
            if (transformerNode) {
              transformerNode.nodes([]);
              transformerNode.getLayer().batchDraw();
            }
          } catch (error) {
            console.error('Erreur lors de la désélection:', error);
          }
        }
      }, 50);
    };

    // Gestion du dialogue d'édition de texte
    const openTextDialog = (element) => {
      currentEditingElement.value = element;
      editedText.value = element.text;
      showTextDialog.value = true;
      
      // Focus sur l'input après l'affichage du dialogue
      nextTick(() => {
        textInput.value.focus();
      });
    };
    
    const closeTextDialog = () => {
      showTextDialog.value = false;
      currentEditingElement.value = null;
    };
    
    const saveTextChanges = () => {
      if (!currentEditingElement.value) return;
      
      // Mise à jour du texte
      presentationStore.updateElement(currentEditingElement.value.id, {
        text: editedText.value
      });
      
      // Forcer la mise à jour
      presentationStore.presentation = {...presentationStore.presentation};
      
      // Fermer le dialogue
      closeTextDialog();
      
      // Sélectionner l'élément
      selectElement(currentEditingElement.value.id);
    };
    
    // Gestion des événements
    
    // Clic sur le canvas
    const handleMouseDown = (e) => {
      if (showTextDialog.value) return;
      
      // Ne pas désélectionner si on clique sur le transformer ou un élément
      const clickedOnEmpty = e.target === e.target.getStage() || e.target.name() === 'background';
      if (clickedOnEmpty) {
        deselectElement();
      }
    };
    
    // Fin de drag pour un élément texte
    const handleTextDragEnd = (e, elementId) => {
      const node = e.target;
      presentationStore.updateElement(elementId, {
        position: {
          x: node.x(),
          y: node.y(),
          // Conserver les dimensions
          width: node.width(),
          height: node.height()
        }
      });
      
      // Émettre un événement pour le composant parent
      emit('element-updated', {
        id: elementId,
        type: 'text',
        position: {
          x: node.x(),
          y: node.y(),
          width: node.width(),
          height: node.height()
        }
      });
    };
    
    // Fin de transformation pour un élément texte
    const handleTextTransformEnd = (e, elementId) => {
      const node = e.target;
      presentationStore.updateElement(elementId, {
        position: {
          x: node.x(),
          y: node.y(),
          width: node.width(),
          height: node.height()
        }
      });
      
      emit('element-updated', {
        id: elementId,
        type: 'text',
        position: {
          x: node.x(),
          y: node.y(),
          width: node.width(),
          height: node.height()
        }
      });
    };
    
    // Fin de drag pour une image
    const handleImageDragEnd = (e, elementId) => {
      const node = e.target;
      presentationStore.updateElement(elementId, {
        position: {
          x: node.x(),
          y: node.y(),
          width: node.width(),
          height: node.height()
        }
      });
      
      emit('element-updated', {
        id: elementId,
        type: 'image',
        position: {
          x: node.x(),
          y: node.y(),
          width: node.width(),
          height: node.height()
        }
      });
    };
    
    // Fin de drag pour une forme
    const handleShapeDragEnd = (e, elementId) => {
      const node = e.target;
      presentationStore.updateElement(elementId, {
        position: {
          x: node.x(),
          y: node.y(),
          width: node.width(),
          height: node.height()
        }
      });
      
      emit('element-updated', {
        id: elementId,
        type: 'shape',
        position: {
          x: node.x(),
          y: node.y(),
          width: node.width(),
          height: node.height()
        }
      });
    };
    
    // Fonctions utilitaires
    
    // Obtenir le composant Konva approprié pour le type de forme
    const getShapeComponent = (shapeType) => {
      switch (shapeType) {
        case 'rectangle':
          return 'v-rect';
        case 'ellipse':
        case 'circle':
          return 'v-ellipse';
        case 'triangle':
          return 'v-regular-polygon';
        case 'line':
          return 'v-line';
        default:
          return 'v-rect'; // Par défaut
      }
    };
    
    // Obtenir la configuration pour une forme
    const getShapeConfig = (element) => {
      const baseConfig = {
        x: element.position.x,
        y: element.position.y,
        width: element.position.width,
        height: element.position.height,
        fill: element.style?.fill || '#CCCCCC',
        stroke: element.style?.stroke || '#000000',
        strokeWidth: element.style?.strokeWidth || 1,
        draggable: true,
        id: element.id
      };
      
      // Configurations spécifiques par type de forme
      if (element.shapeType === 'triangle') {
        return {
          ...baseConfig,
          sides: 3,
          radius: Math.min(element.position.width, element.position.height) / 2
        };
      }
      
      if (element.shapeType === 'circle') {
        return {
          ...baseConfig,
          radiusX: element.position.width / 2,
          radiusY: element.position.height / 2
        };
      }
      
      return baseConfig;
    };
    
    // Obtenir le style du texte
    const getTextStyle = (element) => {
      let style = '';
      if (element.style?.bold) style += 'bold ';
      if (element.style?.italic) style += 'italic ';
      return style || 'normal';
    };
    
    // Charger une image
    const loadImage = (element) => {
      if (!element.src) return;
      
      const img = new Image();
      img.src = element.src;
      img.onload = () => {
        loadedImages.value[element.id] = img;
        elementsLayer.value.getNode().batchDraw();
      };
    };
    
    // Chargement des images au montage du composant
    onMounted(() => {
      // Charger toutes les images
      imageElements.value.forEach(loadImage);
      
      // Attendre que les composants Konva soient montés
      setTimeout(() => {
        // Vérifier si le stage est disponible
        if (stage.value && stage.value.getNode()) {
          // Ajouter un écouteur d'événement pour la touche Échap
          window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
              if (showTextDialog.value) {
                closeTextDialog();
              } else {
                deselectElement();
              }
            }
            
            // Gestion de la touche Supprimer
            // if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementId.value && !showTextDialog.value) {
            //   // Empêcher la suppression du contenu de la page si un input a le focus
            //   if (e.target.tagName.toLowerCase() === 'input' || e.target.tagName.toLowerCase() === 'textarea') {
            //     return;
            //   }
              
            //   e.preventDefault();
            //   deleteSelectedElement();
            // }
          });
        }
      }, 100);
    });
    
    // Observer les changements de diapositives et recharger les images si nécessaire
    watch(
      () => props.slideData,
      (newSlide) => {
        if (newSlide && newSlide.elements) {
          // Recharger les images si nécessaire
          newSlide.elements
            .filter(el => el.type === 'image')
            .forEach(loadImage);
          
          // Désélectionner l'élément actuel
          deselectElement();
          
          // Fermer le dialogue de texte s'il est ouvert
          if (showTextDialog.value) {
            closeTextDialog();
          }
        }
      },
      { deep: true }
    );
    
    // Supprimer l'élément sélectionné
    const deleteSelectedElement = () => {
      if (!selectedElementId.value) return;
      
      // Supprimer l'élément de la diapositive
      presentationStore.deleteElement(selectedElementId.value);
      
      // Désélectionner l'élément supprimé
      deselectElement();
      
      // Émettre un événement pour le composant parent
      emit('element-deleted', {
        id: selectedElementId.value
      });
    };
    
    return {
      stage,
      elementsLayer,
      selectionLayer,
      transformer,
      textInput,
      stageConfig,
      textElements,
      imageElements,
      shapeElements,
      selectedElementId,
      loadedImages,
      showTextDialog,
      editedText,
      currentEditingElement,
      handleMouseDown,
      handleTextDragEnd,
      handleTextTransformEnd,
      openTextDialog,
      closeTextDialog,
      saveTextChanges,
      handleImageDragEnd,
      handleShapeDragEnd,
      getShapeComponent,
      getShapeConfig,
      getTextStyle,
      selectElement,
      deselectElement,
      loadImage,
      deleteSelectedElement
    };
  }
};
</script>

<style scoped>
.slide-editor {
  display: flex;
  justify-content: center;
  width: 100%;
  margin: 20px 0;
  overflow: visible;
  position: relative;
}

.slide-editor-canvas {
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  overflow: hidden; 
  max-width: 100%;
  position: relative;
}

.slide-editor-empty {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 800px;
  height: 450px;
  background-color: #f5f5f5;
  border: 1px dashed #ccc;
  border-radius: 4px;
  color: #999;
  font-size: 18px;
}

.text-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.text-dialog {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  width: 400px;
  max-width: 90%;
}

.text-dialog h3 {
  margin-top: 0;
  margin-bottom: 16px;
  color: #333;
  font-size: 18px;
}

.text-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 16px;
  margin-bottom: 16px;
}

.text-input:focus {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  outline: none;
}

.dialog-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

button {
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  border: none;
}

.save-btn {
  background-color: #1890ff;
  color: white;
}

.save-btn:hover {
  background-color: #40a9ff;
}

.cancel-btn {
  background-color: #f5f5f5;
  color: #333;
  border: 1px solid #d9d9d9;
}

.cancel-btn:hover {
  background-color: #e0e0e0;
}
</style> 