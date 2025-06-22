import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { StatementData } from '@/types';

export async function generatePDF(
  elementId: string, 
  statementData: StatementData
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Statement element not found');
  }

  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  loadingDiv.innerHTML = `
    <div class="bg-white p-6 rounded-lg shadow-lg">
      <div class="flex items-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
        <p class="text-lg">Generating PDF...</p>
      </div>
    </div>
  `;
  document.body.appendChild(loadingDiv);

  try {
    const clonedElement = element.cloneNode(true) as HTMLElement;
    
    clonedElement.style.width = '1056px';
    clonedElement.style.backgroundColor = 'white';
    clonedElement.style.padding = '40px';
    clonedElement.style.position = 'absolute';
    clonedElement.style.left = '-9999px';
    clonedElement.style.top = '0';
    
    document.body.appendChild(clonedElement);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const canvas = await html2canvas(clonedElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1056,
      onclone: (clonedDoc) => {
        const elements = clonedDoc.querySelectorAll('*');
        elements.forEach((el) => {
          if (el instanceof HTMLElement) {
            const computedStyle = window.getComputedStyle(el);
            if (computedStyle.color.includes('oklch')) {
              el.style.color = '#111827';
            }
            if (computedStyle.backgroundColor.includes('oklch')) {
              el.style.backgroundColor = 'transparent';
            }
          }
        });
      }
    });
    
    document.body.removeChild(clonedElement);
    
    // Calculate PDF dimensions for LANDSCAPE orientation
    const imgWidth = 297;
    const pageHeight = 210; // A4 landscape height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    
    const pdf = new jsPDF('l', 'mm', 'a4'); // 'l' for landscape
    let position = 0;
    
    pdf.addImage(
      canvas.toDataURL('image/png'),
      'PNG',
      0,
      position,
      imgWidth,
      imgHeight,
      undefined,
      'FAST'
    );
    heightLeft -= pageHeight;
    
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(
        canvas.toDataURL('image/png'),
        'PNG',
        0,
        position,
        imgWidth,
        imgHeight,
        undefined,
        'FAST'
      );
      heightLeft -= pageHeight;
    }
    
    const filename = `${statementData.companyName.replace(/[^a-z0-9]/gi, '_')}_Statement_${statementData.startDate}_${statementData.endDate}.pdf`;
    
    pdf.save(filename);
  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  } finally {
    document.body.removeChild(loadingDiv);
  }
}