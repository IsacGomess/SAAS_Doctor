import { useEffect, useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';

const SignaturePad = ({ title, description, onChange }) => {
  const wrapperRef = useRef(null);
  const signatureRef = useRef(null);
  const [canvasWidth, setCanvasWidth] = useState(0);

  useEffect(() => {
    const updateWidth = () => {
      if (!wrapperRef.current) return;
      const nextWidth = Math.max(280, Math.floor(wrapperRef.current.offsetWidth));
      setCanvasWidth(nextWidth);
      signatureRef.current?.clear();
      onChange(null, true);
    };

    updateWidth();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(updateWidth);
      observer.observe(wrapperRef.current);
      return () => observer.disconnect();
    }

    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [onChange]);

  const clear = () => {
    signatureRef.current?.clear();
    onChange(null, false);
  };

  const isEmpty = () => signatureRef.current?.isEmpty() !== false;

  const getDataUrl = () => {
    if (!signatureRef.current || signatureRef.current.isEmpty()) return null;
    return signatureRef.current.toDataURL('image/png');
  };

  return (
    <div className="clinical-signature-pad">
      <h6 className="mb-1">{title}</h6>
      {description ? <p className="text-muted mb-3">{description}</p> : null}

      <div ref={wrapperRef} className="clinical-signature-canvas-wrapper">
        {canvasWidth > 0 && (
          <SignatureCanvas
            ref={signatureRef}
            penColor="#1f2937"
            canvasProps={{
              width: canvasWidth,
              height: 170,
              className: 'clinical-signature-canvas'
            }}
            onEnd={() => onChange(getDataUrl(), false)}
          />
        )}
      </div>

      <div className="d-flex justify-content-end mt-2">
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={clear}>
          Limpar
        </button>
      </div>

      <input type="hidden" value={isEmpty() ? '' : 'filled'} readOnly />
    </div>
  );
};

export default SignaturePad;
