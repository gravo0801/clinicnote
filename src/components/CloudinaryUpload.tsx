import { useRef, useEffect } from 'react';

interface CloudinaryUploadProps {
  onUploadSuccess?: (result: any) => void;   // 업로드 성공 시 실행될 콜백
  buttonText?: string;                       // 버튼 텍스트 (기본: "파일 업로드")
  multiple?: boolean;                        // 여러 파일 허용 여부
  folder?: string;                           // Cloudinary에 저장될 폴더명 (선택)
}

const CloudinaryUpload = ({
  onUploadSuccess,
  buttonText = "파일 업로드",
  multiple = true,
  folder = "clinicnotes",   // clinicnote_uploads 프리셋에 맞게 예시로 넣음
}: CloudinaryUploadProps) => {
  const widgetRef = useRef<any>();
  const cloudinaryRef = useRef<any>();

  useEffect(() => {
    // window.cloudinary 객체 로드
    cloudinaryRef.current = (window as any).cloudinary;
  }, []);

  const openUploadWidget = () => {
    if (!cloudinaryRef.current) {
      alert("Cloudinary Widget을 로드하지 못했습니다.");
      return;
    }

    widgetRef.current = cloudinaryRef.current.createUploadWidget(
      {
        cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
        uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
        multiple,
        folder,                    // 원하는 폴더명 (없으면 자동)
        // maxFiles: 5,            // 최대 파일 수 제한 (필요시 주석 해제)
        // maxFileSize: 10 * 1024 * 1024, // 10MB 제한 예시
        resourceType: "auto",      // 이미지, PDF, 문서 등 모두 지원
      },
      (error: any, result: any) => {
        if (!error && result && result.event === "success") {
          console.log("✅ Cloudinary 업로드 성공:", result.info);
          onUploadSuccess?.(result.info); // secure_url, public_id 등 전달
        }
      }
    );

    widgetRef.current.open();
  };

  return (
    <button onClick={openUploadWidget} className="btn btn-primary">
      {buttonText}
    </button>
  );
};

export default CloudinaryUpload;
