import { defineStore } from 'pinia'
import axios from 'axios'

export const usePresentationStore = defineStore('presentation', {
  state: () => ({
    // État initial de la présentation
    presentation: {
      title: 'Présentation sans titre',
      slides: []
    },
    currentSlideIndex: 0,
    isLoading: false,
    error: null
  }),

  getters: {
    // Obtient la diapositive actuellement sélectionnée
    currentSlide: (state) => {
      if (!state.presentation.slides.length) return null
      return state.presentation.slides[state.currentSlideIndex]
    },
    
    // Nombre total de diapositives
    slideCount: (state) => state.presentation.slides.length
  },

  actions: {
    // Charge une présentation depuis le serveur
    async loadPresentation(presentationId) {
      this.isLoading = true
      this.error = null
      
      try {
        const response = await axios.get(`/api/presentations/${presentationId}`)
        this.presentation = response.data
        this.currentSlideIndex = 0
      } catch (error) {
        this.error = error.message || 'Erreur lors du chargement de la présentation'
        console.error('Erreur lors du chargement:', error)
      } finally {
        this.isLoading = false
      }
    },
    
    // Simule le chargement d'une présentation avec des données de test
    loadSamplePresentation() {
      this.isLoading = true
      
      // Données d'exemple pour tester l'interface
      const samplePresentation = {
        title: 'Présentation de démonstration',
        slides: [
          {
            id: 'slide-1',
            title: 'Bienvenue dans l\'éditeur',
            elements: [
              {
                type: 'text',
                id: 'text-1',
                text: 'Bienvenue dans l\'éditeur PPTX',
                position: {
                  x: 100,
                  y: 50,
                  width: 400,
                  height: 50
                },
                style: {
                  fontFamily: 'Arial',
                  fontSize: 24,
                  color: '#333333',
                  bold: true
                }
              },
              {
                type: 'text',
                id: 'text-2',
                text: 'Vous pouvez éditer cette présentation en déplaçant les éléments',
                position: {
                  x: 100,
                  y: 120,
                  width: 400,
                  height: 40
                },
                style: {
                  fontFamily: 'Arial',
                  fontSize: 16,
                  color: '#666666'
                }
              },
              {
                type: 'shape',
                id: 'shape-1',
                shapeType: 'rectangle',
                position: {
                  x: 70,
                  y: 200,
                  width: 150,
                  height: 100
                },
                style: {
                  fill: '#E6F7FF',
                  stroke: '#1890FF',
                  strokeWidth: 2
                }
              }
            ],
            background: {
              color: '#FFFFFF'
            }
          },
          {
            id: 'slide-2',
            title: 'Deuxième diapositive',
            elements: [
              {
                type: 'text',
                id: 'text-3',
                text: 'Deuxième diapositive',
                position: {
                  x: 100,
                  y: 50,
                  width: 400,
                  height: 50
                },
                style: {
                  fontFamily: 'Arial',
                  fontSize: 24,
                  color: '#333333',
                  bold: true
                }
              },
              {
                type: 'shape',
                id: 'shape-2',
                shapeType: 'ellipse',
                position: {
                  x: 250,
                  y: 150,
                  width: 100,
                  height: 100
                },
                style: {
                  fill: '#FFCCC7',
                  stroke: '#FF4D4F',
                  strokeWidth: 2
                }
              }
            ],
            background: {
              color: '#F5F5F5'
            }
          }
        ],
        metadata: {
          author: 'Utilisateur Test',
          created: new Date().toISOString()
        }
      }
      
      setTimeout(() => {
        this.presentation = samplePresentation
        this.currentSlideIndex = 0
        this.isLoading = false
      }, 500) // Simule un délai réseau
    },
    
    // Change la diapositive actuellement sélectionnée
    setCurrentSlide(index) {
      if (index >= 0 && index < this.presentation.slides.length) {
        this.currentSlideIndex = index
      }
    },
    
    // Navigue à la diapositive suivante
    nextSlide() {
      if (this.currentSlideIndex < this.presentation.slides.length - 1) {
        this.currentSlideIndex++
      }
    },
    
    // Navigue à la diapositive précédente
    prevSlide() {
      if (this.currentSlideIndex > 0) {
        this.currentSlideIndex--
      }
    },
    
    // Met à jour un élément de la diapositive actuelle
    updateElement(elementId, properties) {
      const slide = this.presentation.slides[this.currentSlideIndex]
      const elementIndex = slide.elements.findIndex(el => el.id === elementId)
      
      if (elementIndex !== -1) {
        // Fusion des propriétés mises à jour avec l'élément existant
        slide.elements[elementIndex] = {
          ...slide.elements[elementIndex],
          ...properties
        }
        
        // Si les positions sont mises à jour, fusionner correctement
        if (properties.position) {
          slide.elements[elementIndex].position = {
            ...slide.elements[elementIndex].position,
            ...properties.position
          }
        }
        
        // Si le style est mis à jour, fusionner correctement
        if (properties.style) {
          slide.elements[elementIndex].style = {
            ...slide.elements[elementIndex].style,
            ...properties.style
          }
        }
      }
    },
    
    // Sauvegarde les modifications de la présentation sur le serveur
    async savePresentation() {
      this.isLoading = true
      
      try {
        // Si la présentation a un ID, on utilise PUT pour la mettre à jour
        if (this.presentation.id) {
          await axios.put(`/api/presentations/${this.presentation.id}`, this.presentation)
        } else {
          // Sinon, on crée une nouvelle présentation avec POST
          const response = await axios.post('/api/presentations', this.presentation)
          // Mettre à jour l'ID de la présentation locale avec celui retourné par le serveur
          this.presentation.id = response.data.id
        }
        
        return true
      } catch (error) {
        this.error = error.message || 'Erreur lors de la sauvegarde'
        console.error('Erreur lors de la sauvegarde:', error)
        return false
      } finally {
        this.isLoading = false
      }
    }
  }
}) 