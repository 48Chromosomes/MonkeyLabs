import { MarkdownTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from 'langchain/embeddings';
import { PineconeStore } from 'langchain/vectorstores';
import { initPinecone } from '../utilities/pinecone-client.js';
import { PINECONE_INDEX_NAME, PINECONE_NAME_SPACE } from '../config/pinecone.js';
import { DirectoryLoader, NotionLoader } from 'langchain/document_loaders';

/* Name of directory to retrieve your files from */
const filePath = 'docs';

export const run = async () => {
  try {
    const pinecone = await initPinecone();

    /*const directoryLoader = new DirectoryLoader(filePath, {
      '.md': (path) => new NotionLoader(path),
      '.json': (path) => new JSONLoader(path),
    });*/

    const loader = new NotionLoader(filePath);

    const rawDocs = await loader.load();

    const textSplitter = new MarkdownTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const docs = await textSplitter.splitDocuments(rawDocs);

    console.log('split docs', docs);

    console.log('creating vector store...');

    const embeddings = new OpenAIEmbeddings();
    const index = pinecone.Index(PINECONE_INDEX_NAME);

    console.log('ingesting data...');

    await PineconeStore.fromDocuments(docs, embeddings, {
      pineconeIndex: index,
      namespace: PINECONE_NAME_SPACE,
      textKey: 'text',
    });
  } catch (error) {
    console.log('error', error);
    throw new Error('Failed to ingest your data');
  }
};

(async () => {
  await run();
  console.log('ingestion complete');
})();