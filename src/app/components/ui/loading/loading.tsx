export default function LoadingComponent() {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
        }}>
            <div style={{
                backgroundColor: 'white',
                padding: '40px 24px',
                borderRadius: '20px',
                textAlign: 'center',
                maxWidth: '280px',
                width: '100%',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            }}>
                {/* 로딩 스피너 */}
                <div style={{
                    position: 'relative',
                    width: '60px',
                    height: '60px',
                    margin: '0 auto 24px',
                }}>
                    {/* 회전하는 이중 원 */}
                    <div style={{
                        width: '60px',
                        height: '60px',
                        border: '4px solid #e8f4f8',
                        borderTop: '4px solid #3498db',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                    }} />
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '40px',
                        height: '40px',
                        border: '4px solid #e8f4f8',
                        borderBottom: '4px solid #2980b9',
                        borderRadius: '50%',
                        animation: 'spinReverse 0.8s linear infinite',
                    }} />
                </div>

                {/* 로딩 텍스트 */}
                <div style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#2c3e50',
                }}>
                    잠시만 기다려주세요
                </div>

                {/* 로딩 도트 애니메이션 */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '6px',
                    marginTop: '16px',
                }}>
                    <div style={{
                        width: '8px',
                        height: '8px',
                        backgroundColor: '#3498db',
                        borderRadius: '50%',
                        animation: 'dot1 1.4s ease-in-out infinite',
                    }} />
                    <div style={{
                        width: '8px',
                        height: '8px',
                        backgroundColor: '#3498db',
                        borderRadius: '50%',
                        animation: 'dot2 1.4s ease-in-out infinite',
                    }} />
                    <div style={{
                        width: '8px',
                        height: '8px',
                        backgroundColor: '#3498db',
                        borderRadius: '50%',
                        animation: 'dot3 1.4s ease-in-out infinite',
                    }} />
                </div>
            </div>

            <style jsx>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                @keyframes spinReverse {
                    0% { transform: translate(-50%, -50%) rotate(0deg); }
                    100% { transform: translate(-50%, -50%) rotate(-360deg); }
                }

                @keyframes dot1 {
                    0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
                    40% { transform: scale(1.2); opacity: 1; }
                }

                @keyframes dot2 {
                    0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
                    50% { transform: scale(1.2); opacity: 1; }
                }

                @keyframes dot3 {
                    0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
                    60% { transform: scale(1.2); opacity: 1; }
                }
            `}</style>
        </div>
    );
}