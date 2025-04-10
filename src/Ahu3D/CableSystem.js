/**
 * AHU Cable Management Module - CableSystem.js
 */

/**
 * Represents a single wire within a cable
 */
class Wire {
  /**
   * Create a new Wire
   * @param {Object} options - Wire configuration options
   * @param {string} options.id - Unique wire identifier (e.g., "Wire-1")
   * @param {string} [options.label] - Human-readable label (e.g., "Ground Wire")
   * @param {string} [options.fieldWiring] - Field wiring designation (e.g., "White", "Power")
   * @param {string} [options.panelWiringId] - Panel connection point (e.g., "I1-9B")
   * @param {string} [options.type] - Wire type (e.g., "18 Gauge")
   * @param {string} [options.color] - Wire color (e.g., "Red")
   * @param {number} [options.size] - Wire gauge size (e.g., 18)
   * @param {string} [options.markers] - Additional wire markers (e.g., "SCHP1-CS")
   */
  constructor({
    id,
    label = null,
    fieldWiring = null,
    panelWiringId = null,
    type = null,
    color = null,
    size = null,
    markers = null
  } = {}) {
    if (!id) throw new Error("Wire requires an ID");
    
    this.id = id;
    this.label = label;
    this.fieldWiring = fieldWiring;
    this.panelWiringId = panelWiringId;
    this.type = type;
    this.color = color;
    this.size = size;
    this.markers = markers;
  }

  /**
   * Set the wire label
   * @param {string} label - Human-readable label
   */
  setLabel(label) {
    this.label = label;
    return this;
  }

  /**
   * Set the field wiring designation
   * @param {string} fieldWiring - Field wiring designation
   */
  setFieldWiring(fieldWiring) {
    this.fieldWiring = fieldWiring;
    return this;
  }

  /**
   * Set the panel wiring ID
   * @param {string} panelWiringId - Panel connection point
   */
  setPanelWiringId(panelWiringId) {
    this.panelWiringId = panelWiringId;
    return this;
  }

  /**
   * Set the wire type
   * @param {string} type - Wire type
   */
  setType(type) {
    this.type = type;
    return this;
  }

  /**
   * Set the wire color
   * @param {string} color - Wire color
   */
  setColor(color) {
    this.color = color;
    return this;
  }

  /**
   * Set the wire size/gauge
   * @param {number} size - Wire gauge size
   */
  setSize(size) {
    this.size = size;
    return this;
  }

  /**
   * Set additional wire markers
   * @param {string} markers - Additional markers
   */
  setMarkers(markers) {
    this.markers = markers;
    return this;
  }

  /**
   * Get the wire as a plain object
   * @return {Object} Plain object representation of the wire
   */
  toObject() {
    return {
      id: this.id,
      label: this.label,
      fieldWiring: this.fieldWiring,
      panelWiringId: this.panelWiringId,
      type: this.type,
      color: this.color,
      size: this.size,
      markers: this.markers
    };
  }
}

/**
 * Represents a cable containing multiple wires
 */
class Cable {
  /**
   * Create a new Cable
   * @param {Object} options - Cable configuration options
   * @param {string} options.id - Unique cable identifier (e.g., "Cable-1")
   * @param {string} [options.label] - Human-readable label (e.g., "Fan Cable")
   * @param {string} [options.equipment] - Equipment/component type (e.g., "Fan")
   * @param {string} [options.idTag] - Component ID (e.g., "Fan-1")
   * @param {string} [options.pointName] - Component name (e.g., "Fan Outer")
   * @param {string} [options.markers] - Additional cable markers (e.g., "SCHP1-CS")
   * @param {Array<Object>} [options.wires] - Initial wire configurations
   */
  constructor({
    id,
    label = null,
    equipment = null,
    idTag = null,
    pointName = null,
    markers = null,
    wires = []
  } = {}) {
    if (!id) throw new Error("Cable requires an ID");
    
    this.id = id;
    this.label = label;
    this.equipment = equipment;
    this.idTag = idTag;
    this.pointName = pointName;
    this.markers = markers;
    this.wires = wires.map(wireConfig => 
      wireConfig instanceof Wire ? wireConfig : new Wire(wireConfig)
    );
  }

  /**
   * Set the cable label
   * @param {string} label - Human-readable label
   */
  setLabel(label) {
    this.label = label;
    return this;
  }

  /**
   * Set the equipment/component type
   * @param {string} equipment - Equipment/component type
   */
  setEquipment(equipment) {
    this.equipment = equipment;
    return this;
  }

  /**
   * Set the component ID tag
   * @param {string} idTag - Component ID
   */
  setIdTag(idTag) {
    this.idTag = idTag;
    return this;
  }

  /**
   * Set the component point name
   * @param {string} pointName - Component name
   */
  setPointName(pointName) {
    this.pointName = pointName;
    return this;
  }

  /**
   * Set additional cable markers
   * @param {string} markers - Additional markers
   */
  setMarkers(markers) {
    this.markers = markers;
    return this;
  }

  /**
   * Add a wire to the cable
   * @param {Wire|Object} wire - Wire instance or configuration object
   */
  addWire(wire) {
    this.wires.push(wire instanceof Wire ? wire : new Wire(wire));
    return this;
  }

  /**
   * Get a wire by ID
   * @param {string} wireId - Wire ID to find
   * @return {Wire|null} Wire instance or null if not found
   */
  getWire(wireId) {
    return this.wires.find(wire => wire.id === wireId) || null;
  }

  /**
   * Remove a wire by ID
   * @param {string} wireId - Wire ID to remove
   * @return {boolean} True if wire was removed, false otherwise
   */
  removeWire(wireId) {
    const initialLength = this.wires.length;
    this.wires = this.wires.filter(wire => wire.id !== wireId);
    return this.wires.length < initialLength;
  }

  /**
   * Get the cable as a plain object
   * @return {Object} Plain object representation of the cable
   */
  toObject() {
    return {
      id: this.id,
      label: this.label,
      equipment: this.equipment,
      idTag: this.idTag,
      pointName: this.pointName,
      markers: this.markers,
      wires: this.wires.map(wire => wire.toObject())
    };
  }
}

/**
 * Manages the creation and associations of cables and wires within the AHU system
 */
class CableSystem {
  constructor() {
    this.cables = {}; // Object of cable ID to Cable instance
    this.componentToCables = {}; // Object of component ID to array of cable IDs
    this.panelToCables = {}; // Object of panel wiring ID to array of cable IDs
    this.wiringData = { cables: [] }; // Storage for wiring data
  }

  /**
   * Create a new wire
   * @param {Object} wireConfig - Wire configuration
   * @return {Wire} The created Wire instance
   */
  createWire(wireConfig) {
    return new Wire(wireConfig);
  }
  
  /**
   * Create a new cable
   * @param {Object} cableConfig - Cable configuration
   * @return {Cable} The created Cable instance
   */
  createCable(cableConfig) {
    const cable = new Cable(cableConfig);
    this.cables[cable.id] = cable;
    
    // Add to component associations if cable has idTag
    if (cable.idTag) {
      if (!this.componentToCables[cable.idTag]) {
        this.componentToCables[cable.idTag] = [];
      }
      
      const componentCables = this.componentToCables[cable.idTag];
      if (!componentCables.includes(cable.id)) {
        componentCables.push(cable.id);
      }
    }
    
    return cable;
  }

  /**
   * Set a cable with its associations
   * @param {string} cableId - Unique cable identifier
   * @param {string} [idTag] - Component ID to associate with
   * @param {string} [panelWiringId] - Panel wiring ID to associate with
   * @param {Object} [cableAttributes] - Additional cable attributes
   * @return {Cable} The created or updated Cable instance
   */
  setCable(cableId, idTag = null, panelWiringId = null, cableAttributes = {}) {
    // Get existing cable or create new one
    let cable = this.cables[cableId];
    
    if (!cable) {
      cable = this.createCable({ 
        id: cableId, 
        ...cableAttributes 
      });
    } else {
      // Update existing cable with new attributes
      for (const [key, value] of Object.entries(cableAttributes)) {
        if (key !== 'id' && key !== 'wires') {
          cable[key] = value;
        }
      }
    }
    
    // Handle component association
    if (idTag) {
      cable.setIdTag(idTag);
      
      if (!this.componentToCables[idTag]) {
        this.componentToCables[idTag] = [];
      }
      
      const componentCables = this.componentToCables[idTag];
      if (!componentCables.includes(cableId)) {
        componentCables.push(cableId);
      }
    }
    
    // Handle panel association (via wire)
    if (panelWiringId) {
      // First wire will get the panelWiringId for simplicity
      // More complex logic could be implemented if needed
      if (cable.wires.length === 0) {
        cable.addWire({ 
          id: `${cableId}-Wire-1`, 
          panelWiringId 
        });
      } else {
        cable.wires[0].setPanelWiringId(panelWiringId);
      }
      
      if (!this.panelToCables[panelWiringId]) {
        this.panelToCables[panelWiringId] = [];
      }
      
      const panelCables = this.panelToCables[panelWiringId];
      if (!panelCables.includes(cableId)) {
        panelCables.push(cableId);
      }
    }
    
    return cable;
  }

  /**
   * Get cables associated with a component
   * @param {string} idTag - Component ID
   * @return {Array<Cable>} Array of Cable instances
   */
  getCablesByComponent(idTag) {
    const cableIds = this.componentToCables[idTag] || [];
    return cableIds.map(id => this.cables[id]).filter(Boolean);
  }

  /**
   * Get cables associated with a panel connection point
   * @param {string} panelWiringId - Panel wiring ID
   * @return {Array<Cable>} Array of Cable instances
   */
  getCablesByPanel(panelWiringId) {
    const cableIds = this.panelToCables[panelWiringId] || [];
    return cableIds.map(id => this.cables[id]).filter(Boolean);
  }

  /**
   * Get a cable by ID
   * @param {string} cableId - Cable ID
   * @return {Cable|null} Cable instance or null if not found
   */
  getCable(cableId) {
    return this.cables[cableId] || null;
  }
  
  /**
   * Remove a cable and its associations
   * @param {string} cableId - Cable ID to remove
   * @return {boolean} True if cable was removed, false otherwise
   */
  removeCable(cableId) {
    const cable = this.cables[cableId];
    if (!cable) return false;
    
    // Remove from components mapping
    if (cable.idTag && this.componentToCables[cable.idTag]) {
      const componentCables = this.componentToCables[cable.idTag];
      const index = componentCables.indexOf(cableId);
      if (index !== -1) {
        componentCables.splice(index, 1);
      }
    }
    
    // Remove from panels mapping
    cable.wires.forEach(wire => {
      if (wire.panelWiringId && this.panelToCables[wire.panelWiringId]) {
        const panelCables = this.panelToCables[wire.panelWiringId];
        const index = panelCables.indexOf(cableId);
        if (index !== -1) {
          panelCables.splice(index, 1);
        }
      }
    });
    
    // Remove the cable itself
    delete this.cables[cableId];
    return true;
  }
  
  /**
   * Get all cables in the system
   * @return {Array<Cable>} Array of all Cable instances
   */
  getAllCables() {
    return Object.values(this.cables);
  }
  
  /**
   * Export the entire cable system as a plain object
   * @return {Object} Object representing the cable system
   */
  cableSystemToObject() {
    return {
      cables: this.getAllCables().map(cable => cable.toObject()),
      componentAssociations: this.componentToCables,
      panelAssociations: this.panelToCables
    };
  }

  // ===================== ENHANCED METHODS =====================
  
  /**
   * Load wiring data into the CableSystem
   * @param {Object} wiringData - Wiring data to load
   * @return {boolean} Success status
   */
  loadWiringData(wiringData) {
    if (!wiringData || !wiringData.cables || !Array.isArray(wiringData.cables)) {
      console.error('Invalid wiringData format');
      return false;
    }

    // Store the wiring data for later access
    this.wiringData = wiringData;

    // Reset existing data
    this.cables = {};
    this.componentToCables = {};
    this.panelToCables = {};

    // Load each cable and its wires into the system
    wiringData.cables.forEach(cableData => {
      // Create a new cable
      const cable = this.createCable({
        id: cableData.id,
        label: cableData.label,
        equipment: cableData.equipment,
        idTag: cableData.idTag,
        pointName: cableData.pointName,
        markers: cableData.markers,
      });

      // Add each wire to the cable
      if (cableData.wires && Array.isArray(cableData.wires)) {
        cableData.wires.forEach(wireData => {
          cable.addWire(wireData);
          
          // Also add to panel associations if wire has panelWiringId
          if (wireData.panelWiringId) {
            if (!this.panelToCables[wireData.panelWiringId]) {
              this.panelToCables[wireData.panelWiringId] = [];
            }
            
            const panelCables = this.panelToCables[wireData.panelWiringId];
            if (!panelCables.includes(cable.id)) {
              panelCables.push(cable.id);
            }
          }
        });
      }
    });

    return true;
  }

  /**
   * Get the current wiring data object in the format needed for rendering
   * @return {Object} Formatted wiring data object
   */
  getWiringDataObject() {
    return {
      cables: this.getAllCables().map(cable => cable.toObject())
    };
  }

  /**
   * Add a wire to an existing cable
   * @param {string} cableId - ID of the cable
   * @param {Object} wireConfig - Wire configuration
   * @return {Wire|null} The created wire or null if cable not found
   */
  addWireToCable(cableId, wireConfig) {
    const cable = this.getCable(cableId);
    if (!cable) return null;

    // Add the wire to the cable
    cable.addWire(wireConfig);
    
    // Update panel associations if wire has panelWiringId
    if (wireConfig.panelWiringId) {
      if (!this.panelToCables[wireConfig.panelWiringId]) {
        this.panelToCables[wireConfig.panelWiringId] = [];
      }
      
      const panelCables = this.panelToCables[wireConfig.panelWiringId];
      if (!panelCables.includes(cableId)) {
        panelCables.push(cableId);
      }
    }

    return cable.getWire(wireConfig.id);
  }

  /**
   * Update an existing cable
   * @param {string} cableId - ID of the cable to update
   * @param {Object} updates - Properties to update
   * @return {Cable|null} The updated cable or null if not found
   */
  updateCable(cableId, updates) {
    const cable = this.getCable(cableId);
    if (!cable) return null;

    // Handle component ID tag change
    if (updates.idTag && updates.idTag !== cable.idTag) {
      // Remove from old component mapping
      if (cable.idTag && this.componentToCables[cable.idTag]) {
        const componentCables = this.componentToCables[cable.idTag];
        const index = componentCables.indexOf(cableId);
        if (index !== -1) {
          componentCables.splice(index, 1);
        }
      }
      
      // Add to new component mapping
      if (!this.componentToCables[updates.idTag]) {
        this.componentToCables[updates.idTag] = [];
      }
      
      const componentCables = this.componentToCables[updates.idTag];
      if (!componentCables.includes(cableId)) {
        componentCables.push(cableId);
      }
    }

    // Apply updates to the cable
    if (updates.label) cable.setLabel(updates.label);
    if (updates.equipment) cable.setEquipment(updates.equipment);
    if (updates.idTag) cable.setIdTag(updates.idTag);
    if (updates.pointName) cable.setPointName(updates.pointName);
    if (updates.markers) cable.setMarkers(updates.markers);

    return cable;
  }

  /**
   * Update an existing wire
   * @param {string} cableId - ID of the cable
   * @param {string} wireId - ID of the wire to update
   * @param {Object} updates - Properties to update
   * @return {Wire|null} The updated wire or null if not found
   */
  updateWire(cableId, wireId, updates) {
    const cable = this.getCable(cableId);
    if (!cable) return null;

    const wire = cable.getWire(wireId);
    if (!wire) return null;

    // Handle panel wiring ID change
    if (updates.panelWiringId && updates.panelWiringId !== wire.panelWiringId) {
      // Remove from old panel mapping
      if (wire.panelWiringId && this.panelToCables[wire.panelWiringId]) {
        const panelCables = this.panelToCables[wire.panelWiringId];
        const index = panelCables.indexOf(cableId);
        if (index !== -1) {
          panelCables.splice(index, 1);
        }
      }
      
      // Add to new panel mapping
      if (!this.panelToCables[updates.panelWiringId]) {
        this.panelToCables[updates.panelWiringId] = [];
      }
      
      const panelCables = this.panelToCables[updates.panelWiringId];
      if (!panelCables.includes(cableId)) {
        panelCables.push(cableId);
      }
    }

    // Apply updates to the wire
    if (updates.label) wire.setLabel(updates.label);
    if (updates.fieldWiring) wire.setFieldWiring(updates.fieldWiring);
    if (updates.panelWiringId) wire.setPanelWiringId(updates.panelWiringId);
    if (updates.type) wire.setType(updates.type);
    if (updates.color) wire.setColor(updates.color);
    if (updates.size) wire.setSize(updates.size);
    if (updates.markers) wire.setMarkers(updates.markers);

    return wire;
  }

  /**
   * Remove a wire from a cable
   * @param {string} cableId - ID of the cable
   * @param {string} wireId - ID of the wire to remove
   * @return {boolean} Success status
   */
  removeWireFromCable(cableId, wireId) {
    const cable = this.getCable(cableId);
    if (!cable) return false;

    // Get the wire before removing it to update panel associations
    const wire = cable.getWire(wireId);
    if (!wire) return false;

    // Remove from panel mapping if wire has panelWiringId
    if (wire.panelWiringId && this.panelToCables[wire.panelWiringId]) {
      // Check if other wires in this cable connect to the same panel
      const otherWiresWithSamePanel = cable.wires.some(w => 
        w.id !== wireId && w.panelWiringId === wire.panelWiringId
      );
      
      // Only remove from panel mapping if no other wire connects to this panel
      if (!otherWiresWithSamePanel) {
        const panelCables = this.panelToCables[wire.panelWiringId];
        const index = panelCables.indexOf(cableId);
        if (index !== -1) {
          panelCables.splice(index, 1);
        }
      }
    }

    return cable.removeWire(wireId);
  }

  /**
   * Filter cables by equipment type
   * @param {string} equipmentType - Type of equipment to filter by
   * @return {Array<Cable>} Filtered cables
   */
  filterCablesByEquipment(equipmentType) {
    return this.getAllCables().filter(cable => 
      cable.equipment === equipmentType
    );
  }

  /**
   * Filter cables by marker text
   * @param {string} markerText - Marker text to filter by
   * @return {Array<Cable>} Filtered cables
   */
  filterCablesByMarker(markerText) {
    return this.getAllCables().filter(cable => 
      cable.markers && cable.markers.includes(markerText)
    );
  }

  /**
   * Filter cables by wire color
   * @param {string} color - Wire color to filter by
   * @return {Array<Cable>} Filtered cables
   */
  filterCablesByWireColor(color) {
    return this.getAllCables().filter(cable => 
      cable.wires.some(wire => wire.color === color)
    );
  }

  /**
   * Generate a cable connection report
   * @return {Object} Report object with cable statistics
   */
  generateCableReport() {
    const report = {
      totalCables: this.getAllCables().length,
      equipmentTypes: {},
      wireColors: {},
      cablesByPanel: {},
      cablesByComponent: {}
    };
    
    // Process all cables
    this.getAllCables().forEach(cable => {
      // Count by equipment type
      if (cable.equipment) {
        if (!report.equipmentTypes[cable.equipment]) {
          report.equipmentTypes[cable.equipment] = 0;
        }
        report.equipmentTypes[cable.equipment]++;
      }
      
      // Count by component
      if (cable.idTag) {
        if (!report.cablesByComponent[cable.idTag]) {
          report.cablesByComponent[cable.idTag] = [];
        }
        report.cablesByComponent[cable.idTag].push(cable.id);
      }
      
      // Process wires
      cable.wires.forEach(wire => {
        // Count wire colors
        if (wire.color) {
          if (!report.wireColors[wire.color]) {
            report.wireColors[wire.color] = 0;
          }
          report.wireColors[wire.color]++;
        }
        
        // Count by panel connection
        if (wire.panelWiringId) {
          if (!report.cablesByPanel[wire.panelWiringId]) {
            report.cablesByPanel[wire.panelWiringId] = [];
          }
          if (!report.cablesByPanel[wire.panelWiringId].includes(cable.id)) {
            report.cablesByPanel[wire.panelWiringId].push(cable.id);
          }
        }
      });
    });
    
    return report;
  }

  /**
   * Export the current wiring data as JSON
   * @return {string} JSON string of the wiring data
   */
  exportWiringDataAsJSON() {
    return JSON.stringify(this.getWiringDataObject(), null, 2);
  }

  /**
   * Save wiring data to local storage
   * @param {string} key - Storage key
   * @return {boolean} Success status
   */
  saveWiringDataToStorage(key = 'ahu_wiring_data') {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, this.exportWiringDataAsJSON());
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to save wiring data to storage', error);
      return false;
    }
  }

  /**
   * Load wiring data from local storage
   * @param {string} key - Storage key
   * @return {boolean} Success status
   */
  loadWiringDataFromStorage(key = 'ahu_wiring_data') {
    try {
      if (typeof localStorage !== 'undefined') {
        const data = localStorage.getItem(key);
        if (!data) return false;
        
        const wiringData = JSON.parse(data);
        return this.loadWiringData(wiringData);
      }
      return false;
    } catch (error) {
      console.error('Failed to load wiring data from storage', error);
      return false;
    }
  }
}

// Export the classes
export { Wire, Cable, CableSystem };