import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import SignaturePad from './SignaturePad';
import './ClinicalSignaturesModal.css';

const ClinicalSignaturesModal = ({
  show,
  loading,
  onClose,
  onConfirm
}) => {
  const [step, setStep] = useState(1);
  const [patientSignature, setPatientSignature] = useState(null);
  const [professionalSignature, setProfessionalSignature] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const canContinue = useMemo(() => Boolean(patientSignature), [patientSignature]);
  const canConfirm = useMemo(() => Boolean(patientSignature && professionalSignature), [patientSignature, professionalSignature]);

  useEffect(() => {
    if (show) return;
    setStep(1);
    setPatientSignature(null);
    setProfessionalSignature(null);
    setErrorMessage('');
  }, [show]);

  const handleClose = () => {
    if (loading) return;
    setStep(1);
    setPatientSignature(null);
    setProfessionalSignature(null);
    setErrorMessage('');
    onClose();
  };

  const handlePatientChange = useCallback((dataUrl, resetStepError) => {
    setPatientSignature(dataUrl);
    if (resetStepError) setErrorMessage('');
  }, []);

  const handleProfessionalChange = useCallback((dataUrl, resetStepError) => {
    setProfessionalSignature(dataUrl);
    if (resetStepError) setErrorMessage('');
  }, []);

  const handleContinue = () => {
    if (!patientSignature) {
      setErrorMessage('A assinatura do paciente é obrigatória para continuar.');
      return;
    }
    setErrorMessage('');
    setStep(2);
  };

  const handleConfirm = async () => {
    if (!canConfirm) {
      setErrorMessage('As duas assinaturas são obrigatórias para confirmar.');
      return;
    }

    setErrorMessage('');
    await onConfirm({ patientSignature, professionalSignature });
  };

  if (!show) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      <div className="modal-backdrop fade show clinical-signature-backdrop"></div>

      <div className="modal fade show d-block clinical-signature-modal" tabIndex="-1" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Assinaturas</h5>
              <button type="button" className="btn-close" aria-label="Close" onClick={handleClose} disabled={loading}></button>
            </div>

            <div className="modal-body">
              {step === 1 ? (
                <SignaturePad
                  title="Assinatura do paciente"
                  description="Assine no espaço abaixo."
                  onChange={handlePatientChange}
                />
              ) : (
                <SignaturePad
                  title="Assinatura do profissional"
                  description="Assine no espaço abaixo."
                  onChange={handleProfessionalChange}
                />
              )}

              {errorMessage ? <div className="alert alert-danger mt-3 mb-0">{errorMessage}</div> : null}
            </div>

            <div className="modal-footer d-flex justify-content-between">
              <button type="button" className="btn btn-outline-secondary" onClick={handleClose} disabled={loading}>
                Cancelar
              </button>

              {step === 1 ? (
                <button type="button" className="btn btn-primary" onClick={handleContinue} disabled={loading || !canContinue}>
                  Continuar
                </button>
              ) : (
                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setStep(1)} disabled={loading}>
                    Voltar
                  </button>
                  <button type="button" className="btn btn-primary" onClick={handleConfirm} disabled={loading || !canConfirm}>
                    {loading ? 'Confirmando...' : 'Confirmar assinaturas'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

export default ClinicalSignaturesModal;
