<template>
  <div class="slide-navigator">
    <div class="slide-navigator-header">
      <h3>Diapositives</h3>
      <button class="add-slide-btn" @click="addNewSlide">
        + Nouvelle diapositive
      </button>
    </div>
    
    <div class="slide-navigator-list">
      <div
        v-for="(slide, index) in slides"
        :key="slide.id"
        class="slide-thumbnail"
        :class="{ active: currentSlideIndex === index }"
        @click="selectSlide(index)"
      >
        <div class="slide-number">{{ index + 1 }}</div>
        <div class="slide-preview">
          <div 
            class="slide-preview-bg"
            :style="{ backgroundColor: slide.background?.color || '#FFFFFF' }"
          >
            <!-- On pourrait ajouter un aperçu miniature des éléments ici -->
            <div v-if="!slide.elements.length" class="slide-preview-empty">
              Diapositive vide
            </div>
            <div v-else class="slide-preview-content">
              {{ slide.elements.length }} élément(s)
            </div>
          </div>
        </div>
        <div class="slide-title">{{ slide.title || `Diapositive ${index + 1}` }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import { usePresentationStore } from '@/stores/presentation';
import { computed } from 'vue';

export default {
  name: 'SlideNavigator',
  
  setup() {
    const presentationStore = usePresentationStore();
    
    // Données liées au store
    const slides = computed(() => presentationStore.presentation.slides);
    const currentSlideIndex = computed(() => presentationStore.currentSlideIndex);
    
    // Sélectionner une diapositive
    const selectSlide = (index) => {
      presentationStore.setCurrentSlide(index);
    };
    
    // Ajouter une nouvelle diapositive
    const addNewSlide = () => {
      // Générer un ID unique pour la nouvelle diapositive
      const newId = `slide-${Date.now()}`;
      
      // Créer une diapositive vide
      const newSlide = {
        id: newId,
        title: `Nouvelle diapositive`,
        elements: [],
        background: {
          color: '#FFFFFF'
        }
      };
      
      // Ajouter la diapositive à la présentation
      presentationStore.presentation.slides.push(newSlide);
      
      // Sélectionner la nouvelle diapositive
      setTimeout(() => {
        presentationStore.setCurrentSlide(presentationStore.presentation.slides.length - 1);
      }, 0);
    };
    
    return {
      slides,
      currentSlideIndex,
      selectSlide,
      addNewSlide
    };
  }
};
</script>

<style scoped>
.slide-navigator {
  width: 250px;
  border-right: 1px solid #e0e0e0;
  background-color: #f9f9f9;
  height: 100%;
  overflow-y: auto;
}

.slide-navigator-header {
  padding: 15px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.slide-navigator-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.add-slide-btn {
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.add-slide-btn:hover {
  background-color: #40a9ff;
}

.slide-navigator-list {
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.slide-thumbnail {
  cursor: pointer;
  padding: 10px;
  border-radius: 4px;
  background-color: white;
  border: 1px solid #e0e0e0;
  transition: all 0.2s;
  position: relative;
}

.slide-thumbnail.active {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.slide-thumbnail:hover {
  border-color: #1890ff;
}

.slide-number {
  position: absolute;
  top: 8px;
  left: 8px;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  width: 20px;
  height: 20px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.slide-preview {
  height: 84px;
  width: 150px;
  margin: 0 auto;
  overflow: hidden;
  border: 1px solid #eee;
}

.slide-preview-bg {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #888;
}

.slide-title {
  margin-top: 8px;
  text-align: center;
  font-size: 12px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style> 