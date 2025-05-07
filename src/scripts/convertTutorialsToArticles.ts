import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { tutorials } from '../data/tutorials';
import { Category } from '../types';
import { Tutorial } from '../types/tutorial';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDJRFjNFtjdH8NuucKeNSpzfF5b40DQRFQ",
  authDomain: "jezweb-kb.firebaseapp.com",
  projectId: "jezweb-kb",
  storageBucket: "jezweb-kb.firebasestorage.app",
  messagingSenderId: "851109416291",
  appId: "1:851109416291:web:462ad083f4fa5b74f55756"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Convert tutorials to article format and save to Firestore
 * @param adminUserId - The user ID of the admin who will be set as the creator
 * @returns A promise that resolves when the operation is complete
 */
export async function convertTutorialsToArticles(adminUserId: string): Promise<void> {
  if (!adminUserId) {
    throw new Error('Admin user ID is required');
  }

  console.log(`Starting conversion of ${tutorials.length} tutorials to articles...`);

  try {
    const articlesCollection = collection(db, 'articles');
    let successCount = 0;
    let errorCount = 0;
    
    for (const tutorial of tutorials as unknown as Tutorial[]) {
      try {
        // Combine all blocks content into a single string
        const contentHtml = tutorial.blocks
          .sort((a, b) => a.order - b.order)
          .map(block => {
            // Process content based on block type
            switch(block.type) {
              case 'heading':
                // Make sure headings have proper HTML structure
                return block.content;
              case 'text':
                // Ensure text blocks are wrapped in paragraphs if not already
                const content = block.content.trim();
                if (!content.startsWith('<p>') && !content.startsWith('<ul>') && !content.startsWith('<ol>')) {
                  return `<p>${content}</p>`;
                }
                return content;
              case 'code':
                // Wrap code blocks in pre and code tags if needed
                if (!block.content.startsWith('<pre>')) {
                  return `<pre><code>${block.content}</code></pre>`;
                }
                return block.content;
              case 'image':
                // Ensure images have proper HTML
                if (!block.content.startsWith('<img')) {
                  return `<figure>${block.content}</figure>`;
                }
                return block.content;
              default:
                return block.content;
            }
          })
          .join('\n\n');
        
        // Create article object
        const articleData = {
          title: tutorial.title,
          content: contentHtml,
          category: tutorial.category as Category,
          tags: tutorial.tags || [],
          image: tutorial.image,
          published: tutorial.status === 'published',
          createdBy: adminUserId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        // Add to Firestore
        const docRef = await addDoc(articlesCollection, articleData);
        console.log(`✅ Converted tutorial "${tutorial.title}" to article with ID: ${docRef.id}`);
        successCount++;
      } catch (error) {
        console.error(`❌ Error converting tutorial "${tutorial.title}":`, error);
        errorCount++;
      }
    }
    
    console.log(`Conversion completed! ${successCount} articles created, ${errorCount} errors.`);
  } catch (error) {
    console.error('Error in conversion process:', error);
    throw error;
  }
}

// Export the initialized Firebase app and db
export { app, db }; 