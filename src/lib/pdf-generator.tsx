import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { StatementData } from '@/types/types';

export async function generatePDF(
  element_id: string, 
  statement_data: StatementData
): Promise<void> {
  const element = document.getElementById(element_id);
  if (!element) {
    throw new Error('Statement element not found');
  }

  const loading_div = document.createElement('div');
  loading_div.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  loading_div.innerHTML = `
    <div class="bg-white p-6 rounded-lg shadow-lg">
      <div class="flex items-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mr-3"></div>
        <p class="text-lg">Generating PDF...</p>
      </div>
    </div>
  `;
  document.body.appendChild(loading_div);

  try {
    // clone element for pdf generation
    const cloned_element = element.cloneNode(true) as HTMLElement;
    
    // set proper sizing for landscape a4
    cloned_element.style.width = '1122px';
    cloned_element.style.backgroundColor = 'white';
    cloned_element.style.padding = '40px';
    cloned_element.style.position = 'absolute';
    cloned_element.style.left = '-9999px';
    cloned_element.style.top = '0';
    
    // fix all color issues before appending
    const fix_colors = (el: Element) => {
      if (el instanceof HTMLElement) {
        const styles = window.getComputedStyle(el);
        
        // check and replace color
        if (styles.color && (styles.color.includes('oklch') || styles.color.includes('rgb'))) {
          if (el.classList.contains('text-orange-500')) {
            el.style.color = '#f97316';
          } else if (el.classList.contains('text-gray-600')) {
            el.style.color = '#4b5563';
          } else if (el.classList.contains('text-gray-400')) {
            el.style.color = '#9ca3af';
          } else if (el.classList.contains('text-white')) {
            el.style.color = '#ffffff';
          } else {
            el.style.color = '#000000';
          }
        }
        
        // check and replace background color
        if (styles.backgroundColor && (styles.backgroundColor.includes('oklch') || styles.backgroundColor.includes('rgb'))) {
          if (el.classList.contains('bg-orange-500')) {
            el.style.backgroundColor = '#f97316';
          } else if (el.classList.contains('bg-gray-50')) {
            el.style.backgroundColor = '#f9fafb';
          } else if (el.classList.contains('bg-white')) {
            el.style.backgroundColor = '#ffffff';
          } else if (el.classList.contains('bg-gray-100')) {
            el.style.backgroundColor = '#f3f4f6';
          }
        }
        
        // check border colors
        if (styles.borderColor && (styles.borderColor.includes('oklch') || styles.borderColor.includes('rgb'))) {
          if (el.classList.contains('border-gray-400')) {
            el.style.borderColor = '#9ca3af';
          } else if (el.classList.contains('border-gray-300')) {
            el.style.borderColor = '#d1d5db';
          }
        }
      }
      
      // recursively fix children
      Array.from(el.children).forEach(fix_colors);
    };
    
    fix_colors(cloned_element);
    
    document.body.appendChild(cloned_element);
    
    // wait for render
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const canvas = await html2canvas(cloned_element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1122,
      width: 1122,
      height: cloned_element.scrollHeight,
      onclone: (_cloned_doc, element) => {
        // additional color fixes in cloned document
        const all_elements = element.querySelectorAll('*');
        all_elements.forEach((el) => {
          if (el instanceof HTMLElement) {
            // ensure no oklch colors remain
            const inline_style = el.getAttribute('style');
            if (inline_style && inline_style.includes('oklch')) {
              el.style.cssText = inline_style.replace(/oklch\([^)]+\)/g, '#000000');
            }
          }
        });
      }
    });
    
    document.body.removeChild(cloned_element);
    
    // create pdf in landscape
    const pdf = new jsPDF('l', 'mm', 'a4');
    
    const img_width = 297;  // a4 landscape width in mm
    const img_height = (canvas.height * img_width) / canvas.width;
    const page_height = 210;  // a4 landscape height in mm
    let height_left = img_height;
    let position = 0;
    
    // add first page
    pdf.addImage(
      canvas.toDataURL('image/png'),
      'PNG',
      0,
      position,
      img_width,
      img_height,
      undefined,
      'FAST'
    );
    height_left -= page_height;
    
    // add additional pages if needed
    while (height_left >= 0) {
      position = height_left - img_height;
      pdf.addPage();
      pdf.addImage(
        canvas.toDataURL('image/png'),
        'PNG',
        0,
        position,
        img_width,
        img_height,
        undefined,
        'FAST'
      );
      height_left -= page_height;
    }
    
    // generate filename
    const start_date = new Date(statement_data.startDate);
    const month_name = start_date.toLocaleDateString('en-US', { month: 'long' });
    const year = start_date.getFullYear();
    const filename = `Noodoe_Statement_${month_name}_${year}.pdf`;
    
    pdf.save(filename);
  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  } finally {
    document.body.removeChild(loading_div);
  }
}