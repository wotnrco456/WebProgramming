/**
 * 데모 게임 페이지 관련 스크립트
 */

document.addEventListener('DOMContentLoaded', function() {
    // 요소 참조
    const gameContent = document.getElementById('game-content');
    const loadGameBtn = document.getElementById('load-game-btn');
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    const restartBtn = document.getElementById('restart-btn');
    const muteBtn = document.getElementById('mute-btn');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // 게임 로드 상태
    let gameLoaded = false;
    let gameElement = null;
    
    // 게임 로드 버튼 클릭 이벤트
    loadGameBtn.addEventListener('click', function() {
        loadGame();
    });
    
    /**
     * 게임 로드 함수
     * HTML 요소를 사용하여 게임 컨텐츠를 로드합니다.
     * iframe 대신 안전한 방식으로 구현
     */
    function loadGame() {
        if (gameLoaded) return;
        
        // 로딩 메시지 보여주기
        gameContent.innerHTML = `
            <div class="game-placeholder">
                <i class="fas fa-spinner fa-spin"></i>
                <p>게임을 불러오는 중입니다. 잠시만 기다려주세요...</p>
            </div>
        `;
        
        try {
            // 게임 컨테이너 생성
            gameElement = document.createElement('div');
            gameElement.className = 'game-embed';
            gameElement.style.width = '100%';
            gameElement.style.height = '100%';
            gameElement.style.backgroundColor = '#000';
            
            // 실제 환경에서는 여기에 게임 HTML을 로드하거나 WebGL 컨텐츠를 삽입합니다
            // 예제에서는 간단한 메시지와 캔버스로 대체
            
            // 캔버스 생성 (실제 게임에서는 WebGL 컨텐츠로 대체)
            const canvas = document.createElement('canvas');
            canvas.width = 1280;
            canvas.height = 720;
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            
            // 간단한 애니메이션으로 게임 로드 시뮬레이션
            const ctx = canvas.getContext('2d');
            let animationId;
            
            function drawGameDemo() {
                // 배경 그리기
                ctx.fillStyle = '#0f172a';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // 간단한 제목 표시
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 36px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('디자인 패턴 데모 게임', canvas.width / 2, 100);
                
                // 게임 시작 메시지
                ctx.fillStyle = '#64748b';
                ctx.font = '24px Inter, sans-serif';
                ctx.fillText('게임이 로드되었습니다.', canvas.width / 2, canvas.height / 2 - 30);
                ctx.fillText('이 영역에 실제 게임이 표시됩니다.', canvas.width / 2, canvas.height / 2 + 30);
                
                // 애니메이션 지속
                animationId = requestAnimationFrame(drawGameDemo);
            }
            
            // 캔버스를 게임 요소에 추가
            gameElement.appendChild(canvas);
            
            // 게임 요소를 게임 컨텐츠에 추가
            gameContent.innerHTML = '';
            gameContent.appendChild(gameElement);
            
            // 애니메이션 시작
            animationId = requestAnimationFrame(drawGameDemo);
            
            // 정리 함수
            const cleanup = () => {
                if (animationId) {
                    cancelAnimationFrame(animationId);
                }
            };
            
            // 게임 로드 상태 업데이트
            gameLoaded = true;
            
            // 로드 완료 로그
            console.log('게임 데모가 성공적으로 로드되었습니다.');
            
            // 윈도우 언로드 시 정리
            window.addEventListener('unload', cleanup);
            
            // 실제 게임 환경에서는 여기에 게임 초기화 코드가 들어갑니다
            // 예: gameInstance.init();
            
        } catch (error) {
            console.error('게임 로드 중 오류 발생:', error);
            
            // 오류 메시지 표시
            gameContent.innerHTML = `
                <div class="game-placeholder">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>게임을 불러오는 중 오류가 발생했습니다.</p>
                    <button id="retry-btn" class="load-game-btn">다시 시도</button>
                </div>
            `;
            
            // 재시도 버튼 이벤트 리스너
            document.getElementById('retry-btn').addEventListener('click', loadGame);
        }
    }
    
    // 전체화면 버튼 클릭 이벤트
    fullscreenBtn.addEventListener('click', function() {
        toggleFullscreen();
    });
    
    /**
     * 전체화면 토글 함수
     */
    function toggleFullscreen() {
        if (!gameContent) return;
        
        if (!document.fullscreenElement) {
            // 전체화면으로 전환
            if (gameContent.requestFullscreen) {
                gameContent.requestFullscreen();
            } else if (gameContent.mozRequestFullScreen) { // Firefox
                gameContent.mozRequestFullScreen();
            } else if (gameContent.webkitRequestFullscreen) { // Chrome, Safari, Opera
                gameContent.webkitRequestFullscreen();
            } else if (gameContent.msRequestFullscreen) { // IE/Edge
                gameContent.msRequestFullscreen();
            }
            
            fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i> 창모드';
        } else {
            // 전체화면 종료
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
            
            fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i> 전체화면';
        }
    }
    
    // 전체화면 변경 이벤트 감지
    document.addEventListener('fullscreenchange', updateFullscreenButton);
    document.addEventListener('webkitfullscreenchange', updateFullscreenButton);
    document.addEventListener('mozfullscreenchange', updateFullscreenButton);
    document.addEventListener('MSFullscreenChange', updateFullscreenButton);
    
    /**
     * 전체화면 버튼 업데이트 함수
     */
    function updateFullscreenButton() {
        if (document.fullscreenElement || 
            document.webkitFullscreenElement || 
            document.mozFullScreenElement || 
            document.msFullscreenElement) {
            fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i> 창모드';
        } else {
            fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i> 전체화면';
        }
    }
    
    // 재시작 버튼 클릭 이벤트
    restartBtn.addEventListener('click', function() {
        if (!gameLoaded) {
            loadGame();
            return;
        }
        
        // 게임 재시작 로직
        // 실제 게임에서는 게임 인스턴스 재시작 함수 호출
        // 예: gameInstance.restart();
        
        // 예제에서는 간단히 메시지 표시
        showGameMessage('게임을 재시작합니다...');
    });
    
    // 음소거 버튼 클릭 이벤트
    let isMuted = false;
    muteBtn.addEventListener('click', function() {
        isMuted = !isMuted;
        
        if (isMuted) {
            muteBtn.innerHTML = '<i class="fas fa-volume-mute"></i> 음소거 해제';
            // 실제 게임에서는 게임 오디오 음소거
            // 예: gameInstance.setMute(true);
        } else {
            muteBtn.innerHTML = '<i class="fas fa-volume-up"></i> 음소거';
            // 실제 게임에서는 게임 오디오 음소거 해제
            // 예: gameInstance.setMute(false);
        }
        
        // 예제에서는 간단히 메시지 표시
        showGameMessage(isMuted ? '게임 소리가 꺼졌습니다.' : '게임 소리가 켜졌습니다.');
    });
    
    /**
     * 게임 메시지 표시 함수
     * @param {string} message 표시할 메시지
     */
    function showGameMessage(message) {
        if (!gameLoaded || !gameElement) return;
        
        const messageElement = document.createElement('div');
        messageElement.className = 'game-message';
        messageElement.textContent = message;
        messageElement.style.position = 'absolute';
        messageElement.style.bottom = '20px';
        messageElement.style.left = '50%';
        messageElement.style.transform = 'translateX(-50%)';
        messageElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        messageElement.style.color = '#fff';
        messageElement.style.padding = '10px 20px';
        messageElement.style.borderRadius = '4px';
        messageElement.style.zIndex = '100';
        
        gameContent.appendChild(messageElement);
        
        // 메시지 자동 제거
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.parentNode.removeChild(messageElement);
            }
        }, 2000);
    }
    
    // 탭 전환 기능
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // 활성화된 탭 버튼 변경
            tabButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // 선택된 탭 컨텐츠 표시
            const tabId = this.getAttribute('data-tab');
            
            tabContents.forEach(content => {
                content.classList.remove('active');
            });
            
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
    
    // 페이지 로드 시 자동으로 게임 로드
    setTimeout(loadGame, 1000);
    
    // 키보드 이벤트 리스너 (게임 내 단축키)
    document.addEventListener('keydown', function(e) {
        if (!gameLoaded) return;
        
        // ESC 키: 전체화면 종료
        if (e.key === 'Escape' && document.fullscreenElement) {
            document.exitFullscreen();
        }
        
        // R 키: 게임 재시작
        if (e.key === 'r' || e.key === 'R') {
            restartBtn.click();
        }
        
        // M 키: 음소거 토글
        if (e.key === 'm' || e.key === 'M') {
            muteBtn.click();
        }
        
        // F 키: 전체화면 토글
        if (e.key === 'f' || e.key === 'F') {
            fullscreenBtn.click();
        }
    });
    
    /**
     * 실제 게임 HTML 콘텐츠를 로드하는 함수
     * iframe 대신 fetch와 DOMParser를 사용하여 안전하게 로드
     * 
     * @param {string} url 로드할 HTML 파일 URL
     * @returns {Promise} HTML 콘텐츠 로드 프로미스
     */
    function loadGameHTMLContent(url) {
        return fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.text();
            })
            .then(html => {
                // HTML 파싱
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                
                // 필요한 스크립트와 스타일을 추출
                const scripts = Array.from(doc.querySelectorAll('script'));
                const styles = Array.from(doc.querySelectorAll('style, link[rel="stylesheet"]'));
                const bodyContent = doc.body.innerHTML;
                
                // 컨테이너 생성
                const container = document.createElement('div');
                container.style.width = '100%';
                container.style.height = '100%';
                container.innerHTML = bodyContent;
                
                // 스타일 추가
                styles.forEach(style => {
                    const clone = style.cloneNode(true);
                    document.head.appendChild(clone);
                });
                
                // 스크립트 추가 (보안 주의: 신뢰할 수 있는 소스만 로드)
                scripts.forEach(script => {
                    if (script.src) {
                        const newScript = document.createElement('script');
                        newScript.src = script.src;
                        document.body.appendChild(newScript);
                    } else {
                        // 인라인 스크립트는 새 스크립트 요소로 실행
                        // 주의: 보안 위험이 있으므로 신뢰할 수 있는 소스만 사용
                        const newScript = document.createElement('script');
                        newScript.textContent = script.textContent;
                        document.body.appendChild(newScript);
                    }
                });
                
                return container;
            });
    }
});
