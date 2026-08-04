import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';
import api from './api';
import { resolveApiUrl } from './apiUrl';

const API_URL = resolveApiUrl(process.env.EXPO_PUBLIC_API_URL, 'https://kriniback.onrender.com/api/');

const POLL_INTERVAL_MS = 1500;
const MAX_POLL_ATTEMPTS = 120; // ~3 minutes

async function createPdfJob(contractId, jobType, withCachet) {
  const { data } = await api.post('pdf-jobs/', {
    contract: contractId,
    job_type: jobType,
    with_cachet: withCachet,
  });
  return data;
}

async function waitForPdfJob(jobId, onStatusChange) {
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    const { data } = await api.get(`pdf-jobs/${jobId}/`);
    if (onStatusChange) onStatusChange(data.status);
    if (data.status === 'READY') return data;
    if (data.status === 'ERROR') {
      throw new Error(data.error_message || 'Erreur lors de la génération du PDF');
    }
  }
  throw new Error('La génération du PDF a pris trop de temps.');
}

async function shareOrOpenPdf(job, label) {
  const token = await AsyncStorage.getItem('access_token');
  const jobId = job.id;
  const filename = job.job_type === 'contract' ? `contrat_${job.contract}.pdf` : `recu_${job.contract}.pdf`;
  const url = `${API_URL}pdf-jobs/${jobId}/download/`;

  if (Platform.OS === 'web') {
    const response = await api.get(`pdf-jobs/${jobId}/download/`, {
      responseType: 'blob',
    });
    const blobUrl = URL.createObjectURL(response.data);
    window.open(blobUrl, '_blank');
    return;
  }

  const downloadRes = await FileSystem.downloadAsync(url, `${FileSystem.cacheDirectory}${filename}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(downloadRes.uri, {
      mimeType: 'application/pdf',
      dialogTitle: label,
    });
  } else {
    Alert.alert('Succès', `PDF téléchargé: ${downloadRes.uri}`);
  }
}

export async function printContract(contractId, withCachet = false, onStatusChange) {
  try {
    const job = await createPdfJob(contractId, 'contract', withCachet);
    if (onStatusChange) onStatusChange(job.status);
    const readyJob = await waitForPdfJob(job.id, onStatusChange);
    await shareOrOpenPdf(readyJob, `Contrat #${contractId}`);
  } catch (e) {
    Alert.alert('Erreur', e.message || 'Impossible de télécharger le PDF');
  }
}

export async function printReservationReceipt(contractId, onStatusChange) {
  try {
    const job = await createPdfJob(contractId, 'receipt', false);
    if (onStatusChange) onStatusChange(job.status);
    const readyJob = await waitForPdfJob(job.id, onStatusChange);
    await shareOrOpenPdf(readyJob, `Reçu de réservation #${contractId}`);
  } catch (e) {
    Alert.alert('Erreur', e.message || 'Impossible de télécharger le PDF');
  }
}
