<template>
  <div class="slide-toolbar">
    <div class="left-tools">
      <button class="toolbar-btn" @click="savePresentation" :disabled="isLoading">
        <span class="icon">💾</span>
        <span class="text">Enregistrer</span>
      </button>
      
      <div class="toolbar-separator"></div>
      
      <button class="toolbar-btn" @click="addTextElement">
        <span class="icon">T</span>
        <span class="text">Ajouter texte</span>
      </button>
      
      <button class="toolbar-btn" @click="addShapeElement">
        <span class="icon">◯</span>
        <span class="text">Ajouter forme</span>
      </button>
      
      <button class="toolbar-btn" @click="uploadImage">
        <span class="icon">🖼️</span>
        <span class="text">Ajouter image</span>
      </button>
      
      <input
        type="file"
        ref="fileInput"
        accept="image/*"
        style="display: none"
        @change="handleImageUpload"
      />
    </div>
    
    <div class="right-tools">
      <button class="toolbar-btn" @click="prevSlide" :disabled="isFirstSlide">
        <span class="icon">←</span>
      </button>
      
      <div class="slide-counter">
        {{ currentSlideIndex + 1 }} / {{ slideCount }}
      </div>
      
      <button class="toolbar-btn" @click="nextSlide" :disabled="isLastSlide">
        <span class="icon">→</span>
      </button>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import { usePresentationStore } from '@/stores/presentation';

export default {
  name: 'SlideToolbar',
  
  setup() {
    const presentationStore = usePresentationStore();
    const fileInput = ref(null);
    
    // Données calculées à partir du store
    const currentSlideIndex = computed(() => presentationStore.currentSlideIndex);
    const slideCount = computed(() => presentationStore.slideCount);
    const isLoading = computed(() => presentationStore.isLoading);
    
    // Vérifier si on est sur la première ou dernière diapositive
    const isFirstSlide = computed(() => currentSlideIndex.value === 0);
    const isLastSlide = computed(() => currentSlideIndex.value === slideCount.value - 1);
    
    // Navigation entre les diapositives
    const prevSlide = () => {
      presentationStore.prevSlide();
    };
    
    const nextSlide = () => {
      presentationStore.nextSlide();
    };
    
    // Sauvegarde de la présentation
    const savePresentation = async () => {
      try {
        await presentationStore.savePresentation();
        alert('Présentation sauvegardée avec succès!');
      } catch (error) {
        alert(`Erreur lors de la sauvegarde: ${error.message}`);
      }
    };
    
    // Ajout d'un élément texte
    const addTextElement = () => {
      const slide = presentationStore.currentSlide;
      if (!slide) return;
      
      const newId = `text-${Date.now()}`;
      const newTextElement = {
        type: 'text',
        id: newId,
        text: 'Nouveau texte',
        position: {
          x: 100,
          y: 100,
          width: 200,
          height: 50
        },
        style: {
          fontFamily: 'Arial',
          fontSize: 16,
          color: '#333333'
        }
      };
      
      slide.elements.push(newTextElement);
      // Forcer la mise à jour du store
      presentationStore.presentation = {...presentationStore.presentation};
    };
    
    // Ajout d'une forme
    const addShapeElement = () => {
      const slide = presentationStore.currentSlide;
      if (!slide) return;
      
      const newId = `shape-${Date.now()}`;
      const newShapeElement = {
        type: 'shape',
        id: newId,
        shapeType: 'rectangle',
        position: {
          x: 100,
          y: 200,
          width: 150,
          height: 100
        },
        style: {
          fill: '#E6F7FF',
          stroke: '#1890FF',
          strokeWidth: 2
        }
      };
      
      slide.elements.push(newShapeElement);
      // Forcer la mise à jour du store
      presentationStore.presentation = {...presentationStore.presentation};
    };
    
    // Ouverture de la boîte de dialogue pour uploader une image
    const uploadImage = () => {
      fileInput.value.click();
    };
    
    // Gestion de l'upload d'image
    const handleImageUpload = (event) => {
      const slide = presentationStore.currentSlide;
      if (!slide) return;
      
      const file = event.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const newId = `image-${Date.now()}`;
        const newImageElement = {
          type: 'image',
          id: newId,
          src: e.target.result,
          position: {
            x: 100,
            y: 100,
            width: 200,
            height: 150
          },
          alt: file.name
        };
        
        slide.elements.push(newImageElement);
        // Forcer la mise à jour du store
        presentationStore.presentation = {...presentationStore.presentation};
        
        // Réinitialiser l'input file
        event.target.value = '';
      };
      
      reader.readAsDataURL(file);
    };
    
    return {
      fileInput,
      currentSlideIndex,
      slideCount,
      isLoading,
      isFirstSlide,
      isLastSlide,
      prevSlide,
      nextSlide,
      savePresentation,
      addTextElement,
      addShapeElement,
      uploadImage,
      handleImageUpload
    };
  }
};
</script>

<style scoped>
.slide-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
}

.left-tools, .right-tools {
  display: flex;
  align-items: center;
  gap: 10px;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  background-color: white;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 14px;
  color: #333;
  transition: all 0.2s;
}

.toolbar-btn:hover {
  border-color: #1890ff;
  color: #1890ff;
}

.toolbar-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  border-color: #d9d9d9;
  color: #d9d9d9;
}

.toolbar-btn .icon {
  font-size: 16px;
}

.toolbar-separator {
  width: 1px;
  height: 24px;
  background-color: #d9d9d9;
  margin: 0 5px;
}

.slide-counter {
  font-size: 14px;
  color: #666;
  padding: 0 10px;
}
</style> 