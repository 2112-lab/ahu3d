import * as THREE from "three";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass.js";
import axios from "axios";
import Preprocess from "../Preprocess/_Preprocess.js";
import Assets3D from "../3D/Assets3D.js";
import Mesh3D from "../3D/Mesh3D.js";
import FlowControl from "./FlowControl.js";
import { sharedData } from "./globals.js";
import wildcardSvg from "../assets/2D-Wildcard.svg";
import { Context } from "svgcanvas";
import jsPDF from "jspdf";
import "svg2pdf.js";
import { CableSystem } from "./CableSystem.js";
import Panel from "../Wiring3D/Panel.js";

class Ahu3DAPI extends CableSystem {
    /**
     * Creates an instance of the AHU3D API.
     * Initializes core components and state management.
     *
     * @param {Object} ahu3DInstance - Instance of the main AHU3D application
     */
    constructor(ahu3DInstance) {
        // Initialize the CableSystem parent class
        super();
        
        // Store reference to main AHU3D instance
        this.ahu3D = ahu3DInstance;    
        
        // Track library loading state
        this.libraryLoadInitiated = false;
        
        // Initialize 3D mesh handler
        this.Mesh3D = new Mesh3D(this.sceneHelper);
        
        // Initialize flow control system
        this.FlowControl = new FlowControl();
        
        // Initialize panel
        this.panel = null;
    }

    /**
     * Initialize the panel component with wiring data
     * @param {HTMLElement} container - DOM element to render the panel into
     * @return {Panel} The initialized panel instance
     */
    initializePanel(container) {
        this.panel = new Panel(container, this.getWiringDataObject());
        return this.panel;
    }

    /**
     * Update the panel with current wiring data
     */
    updatePanel() {
        if (this.panel) {
            this.panel.updateWiringData(this.getWiringDataObject());
        }
    }

    /**
     * Override parent methods to add panel updates
     */
    
    // Override createCable to update panel
    createCable(cableConfig) {
        const cable = super.createCable(cableConfig);
        this.updatePanel();
        return cable;
    }
    
    // Override removeCable to update panel
    removeCable(cableId) {
        const result = super.removeCable(cableId);
        this.updatePanel();
        return result;
    }
    
    // Override addWireToCable to update panel
    addWireToCable(cableId, wireConfig) {
        const wire = super.addWireToCable(cableId, wireConfig);
        this.updatePanel();
        return wire;
    }
    
    // Override removeWireFromCable to update panel
    removeWireFromCable(cableId, wireId) {
        const result = super.removeWireFromCable(cableId, wireId);
        this.updatePanel();
        return result;
    }
    
    // Override updateCable to update panel
    updateCable(cableId, updates) {
        const cable = super.updateCable(cableId, updates);
        this.updatePanel();
        return cable;
    }
    
    // Override updateWire to update panel
    updateWire(cableId, wireId, updates) {
        const wire = super.updateWire(cableId, wireId, updates);
        this.updatePanel();
        return wire;
    }
    
    // Override loadWiringData to update panel
    loadWiringData(wiringData) {
        const result = super.loadWiringData(wiringData);
        this.updatePanel();
        return result;
    }

    /**
     * Handle updating the 3D visualization when cables change
     * @param {string} cableId - ID of the changed cable
     */
    updateCableVisualization(cableId) {
        const cable = this.getCable(cableId);
        if (!cable) return;
        
        // This method integrates with the 3D rendering system
        if (this.ahu3D && this.ahu3D.updateCableRendering) {
            this.ahu3D.updateCableRendering(cable);
        }
    }
    
    /**
     * Render cables in 3D space
     * This method would be implemented based on your specific 3D environment
     */
    renderCablesIn3D() {
        const allCables = this.getAllCables();
        
        // This is just a placeholder for your 3D rendering logic
        if (this.ahu3D && this.ahu3D.renderCables) {
            this.ahu3D.renderCables(allCables);
        }
    }
    
    /**
     * Export cable data as PDF
     * @param {string} filename - Output filename
     * @return {Promise<boolean>} Success status
     */
    async exportCableDataAsPDF(filename = 'cable-system.pdf') {
        try {
            const doc = new jsPDF();
            
            // Add title
            doc.setFontSize(16);
            doc.text('Cable System Report', 20, 20);
            
            // Add generation date
            doc.setFontSize(10);
            doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 30);
            
            // Add cable info
            doc.setFontSize(12);
            doc.text('Cable Inventory:', 20, 40);
            
            let yPos = 50;
            this.getAllCables().forEach((cable, index) => {
                // Check if we need a new page
                if (yPos > 260) {
                    doc.addPage();
                    yPos = 20;
                }
                
                doc.setFontSize(11);
                doc.text(`${index + 1}. ${cable.id} - ${cable.label || 'Unlabeled Cable'}`, 20, yPos);
                yPos += 7;
                
                doc.setFontSize(9);
                doc.text(`Equipment: ${cable.equipment || 'N/A'}`, 25, yPos);
                yPos += 5;
                
                doc.text(`Component: ${cable.idTag || 'N/A'}`, 25, yPos);
                yPos += 5;
                
                doc.text(`Wires: ${cable.wires.length}`, 25, yPos);
                yPos += 5;
                
                cable.wires.forEach(wire => {
                    doc.text(`- ${wire.id}: ${wire.color || 'N/A'} (${wire.panelWiringId || 'No panel'})`, 30, yPos);
                    yPos += 5;
                });
                
                yPos += 5;
            });
            
            // Add report summary
            const report = this.generateCableReport();
            
            // Add a new page for the report
            doc.addPage();
            doc.setFontSize(14);
            doc.text('System Summary', 20, 20);
            
            doc.setFontSize(10);
            doc.text(`Total Cables: ${report.totalCables}`, 20, 30);
            
            // Equipment types
            let eqYPos = 40;
            doc.text('Equipment Types:', 20, eqYPos);
            eqYPos += 5;
            
            Object.entries(report.equipmentTypes).forEach(([type, count]) => {
                doc.text(`- ${type}: ${count}`, 25, eqYPos);
                eqYPos += 5;
            });
            
            // Save the document
            doc.save(filename);
            return true;
        } catch (error) {
            console.error('Failed to export PDF', error);
            return false;
        }
    }
}