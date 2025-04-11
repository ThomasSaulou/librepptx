<template>
  <div class="presentation-editor">
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>Chargement de la présentation...</p>
    </div>
    
    <template v-else>
      <slide-toolbar />
      
      <div class="editor-content">
        <slide-navigator />
        
        <div class="editor-main">
          <h2 class="presentation-title">{{ presentationTitle }}</h2>
          
          <div v-if="!currentSlide" class="empty-state">
            <p>Aucune diapositive disponible.</p>
            <button @click="addFirstSlide">Créer une première diapositive</button>
          </div>
          
          <slide-editor 
            v-else 
            :slide-data="currentSlide"
            @element-updated="handleElementUpdate"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import { computed, onMounted } from 'vue';
import { usePresentationStore } from '@/stores/presentation';
import SlideNavigator from './slides/SlideNavigator.vue';
import SlideEditor from './slides/SlideEditor.vue';
import SlideToolbar from './slides/SlideToolbar.vue';

export default {
  name: 'PresentationEditor',
  
  components: {
    SlideNavigator,
    SlideEditor,
    SlideToolbar
  },
  
  props: {
    presentationId: {
      type: String,
      default: null
    }
  },
  
  setup(props) {
    const presentationStore = usePresentationStore();
    
    // Données calculées
    const isLoading = computed(() => presentationStore.isLoading);
    const presentationTitle = computed(() => presentationStore.presentation.title);
    const currentSlide = computed(() => presentationStore.currentSlide);
    
    // Ajouter une première diapositive
    const addFirstSlide = () => {
      // Créer une diapositive vide
      const newSlide = {
        id: `slide-${Date.now()}`,
        title: 'Première diapositive',
        elements: [],
        background: {
          color: '#FFFFFF'
        }
      };
      
      // Ajouter la diapositive à la présentation
      presentationStore.presentation.slides.push(newSlide);
      
      // Sélectionner la nouvelle diapositive
      presentationStore.setCurrentSlide(0);
    };
    
    // Gérer les mises à jour d'éléments
    const handleElementUpdate = (updatedElement) => {
      console.log('Élément mis à jour:', updatedElement);
      // La mise à jour est déjà gérée par le store dans SlideEditor.vue
    };
    
    // Au montage du composant
    onMounted(() => {
      // Si un ID de présentation est fourni, charger cette présentation
      if (props.presentationId) {
        presentationStore.loadPresentation(props.presentationId);
      } else {
        // Sinon, charger un exemple pour démonstration
        presentationStore.loadSamplePresentation();
      }
    });
    
    return {
      isLoading,
      presentationTitle,
      currentSlide,
      addFirstSlide,
      handleElementUpdate
    };
  }
};
</script>

<style scoped>
.presentation-editor {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  position: relative;
  overflow: hidden;
}

.editor-content {
  display: flex;
  flex: 1;
  overflow: hidden;
  width: 100%;
}

.editor-main {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: calc(100% - 250px);
}

.presentation-title {
  font-size: 24px;
  margin-bottom: 20px;
  color: #333;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  background-color: #f9f9f9;
  border: 1px dashed #ccc;
  border-radius: 8px;
  padding: 20px;
  margin-top: 20px;
}

.empty-state p {
  margin-bottom: 20px;
  color: #666;
}

.empty-state button {
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #1890ff;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style> 