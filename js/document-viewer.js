/**
 * PDF 문서 뷰어 스크립트 (개선된 버전)
 * PDF.js 라이브러리를 사용하여 PDF 문서를 로드하고 표시합니다.
 * - 전체 페이지를 한 번에 로드하는 기능 추가
 * - 문서 전체에 일관된 확대/축소 적용
 */

document.addEventListener('DOMContentLoaded', function() {
    // PDF.js 초기화
    const pdfjsLib = window['pdfjs-dist/build/pdf'];
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

    // 문서 요소 참조
    const pdfViewer = document.getElementById('pdf-viewer');
    const pdfLoading = document.getElementById('pdf-loading');
    const pdfContainer = document.getElementById('viewer');
    const pageNum = document.getElementById('page-num');
    const pageCount = document.getElementById('page-count');
    const prevButton = document.getElementById('prev-page');
    const nextButton = document.getElementById('next-page');
    const zoomIn = document.getElementById('zoom-in');
    const zoomOut = document.getElementById('zoom-out');
    const zoomSelect = document.getElementById('zoom-select');
    const fullScreenBtn = document.getElementById('full-screen');
    const printBtn = document.getElementById('print-document');
    const downloadBtn = document.getElementById('download-document');
    const toggleSidebarBtn = document.getElementById('toggle-sidebar');
    const outlineList = document.getElementById('outline-list');
    const documentContent = document.querySelector('.document-content');

    // PDF 뷰어 상태
    let pdfDoc = null;
    let currentPage = 1;
    let scale = 1.0;
    let pdfOutline = null;
    let pdfPath = './docs/design_patterns.pdf'; // PDF 파일 경로
    let renderedPages = []; // 렌더링된 페이지 추적
    let isRendering = false; // 렌더링 상태 추적

    /**
     * PDF 문서 로드 함수
     */
    function loadPDF() {
        pdfLoading.style.display = 'flex';
        
        // 이전 내용 초기화
        pdfContainer.innerHTML = '';
        renderedPages = [];
        
        // PDF 문서 로드
        pdfjsLib.getDocument(pdfPath).promise.then(function(pdf) {
            pdfDoc = pdf;
            pageCount.textContent = pdf.numPages;
            
            // 로딩 메시지 업데이트
            pdfLoading.innerHTML = `
                <div class="loading-spinner"></div>
                <p>최적의 크기 계산 중...</p>
            `;
            
            // 모든 페이지중 하나를 선택하여 최적의 크기 계산
            pdf.getPage(1).then(function(page) {
                const viewerContainer = document.querySelector('.document-viewer-container');
                const containerWidth = viewerContainer.clientWidth;
                
                // 원본 PDF 페이지의 원래 너비 가져오기 (스케일 1.0)
                const originalViewport = page.getViewport({ scale: 1.0 });
                const originalWidth = originalViewport.width;
                
                // 좌우 간격이 딱 맞는 최적의 스케일 계산
                // 양쪽에 약간의 마진(20px)을 두고 계산
                scale = (containerWidth - 20) / originalWidth;
                console.log('최적의 스케일:', scale);
                
                // 클립 적용: 너무 크거나 작은 경우 조정
                if (scale < 0.5) scale = 0.5; // 최소 스케일
                if (scale > 2.0) scale = 2.0; // 최대 스케일
                
                // 스케일 표시 업데이트
                updateZoomSelect();
                
                // 이제 목차 로드
                loadOutline();
                
                // 계산된 스케일로 모든 페이지 렌더링
                renderAllPages();
            });
            
        }).catch(function(error) {
            console.error('PDF 로드 오류:', error);
            pdfLoading.innerHTML = `
                <div class="error-icon"><i class="fas fa-exclamation-triangle"></i></div>
                <p>PDF 문서를 불러오는 중 오류가 발생했습니다.</p>
                <p class="error-details">${error.message}</p>
                <button id="retry-load" class="control-btn">다시 시도</button>
            `;
            
            document.getElementById('retry-load')?.addEventListener('click', loadPDF);
        });
    }

    /**
     * 모든 페이지를 한 번에 렌더링
     */
    function renderAllPages() {
        // 렌더링 준비
        const totalPages = pdfDoc.numPages;
        let renderedCount = 0;
        
        // 모든 페이지를 순차적으로 렌더링
        function renderNextPage(pageIndex) {
            if (pageIndex > totalPages) {
                // 모든 페이지 렌더링 완료
                pdfLoading.style.display = 'none';
                scrollToPage(currentPage);
                return;
            }
            
            // 로딩 메시지 업데이트
            const loadingMsg = pdfLoading.querySelector('p');
            if (loadingMsg) {
                loadingMsg.textContent = `문서를 불러오는 중... (${pageIndex-1}/${totalPages})`;
            }
            
            // 페이지 렌더링
            pdfDoc.getPage(pageIndex).then(function(page) {
                // 미리 계산된 scale 사용
                const viewport = page.getViewport({ scale: scale });
                
                // 페이지 컨테이너 생성
                const pageContainer = document.createElement('div');
                pageContainer.id = `page-${pageIndex}`;
                pageContainer.className = 'page';
                pageContainer.style.width = `${viewport.width}px`;
                pageContainer.style.height = `${viewport.height}px`;
                pageContainer.dataset.pageNumber = pageIndex;
                
                // 페이지 번호 표시
                const pageLabel = document.createElement('div');
                pageLabel.className = 'page-label';
                pageLabel.textContent = pageIndex;
                pageContainer.appendChild(pageLabel);
                
                // 캔버스 생성
                const canvas = document.createElement('canvas');
                canvas.className = 'page-canvas';
                pageContainer.appendChild(canvas);
                
                // 텍스트 레이어 생성 (검색 및 선택용)
                const textLayerDiv = document.createElement('div');
                textLayerDiv.className = 'textLayer';
                pageContainer.appendChild(textLayerDiv);
                
                // 페이지 컨테이너를 뷰어에 추가
                pdfContainer.appendChild(pageContainer);
                
                // 캔버스 컨텍스트 및 크기 설정
                const context = canvas.getContext('2d');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                
                // 페이지 렌더링
                const renderContext = {
                    canvasContext: context,
                    viewport: viewport
                };
                
                const renderTask = page.render(renderContext);
                
                // 텍스트 레이어 렌더링 (검색 및 선택 기능)
                renderTask.promise.then(function() {
                    // 텍스트 콘텐츠 가져오기
                    return page.getTextContent().then(function(textContent) {
                        // 텍스트 레이어 렌더링
                        pdfjsLib.renderTextLayer({
                            textContent: textContent,
                            container: textLayerDiv,
                            viewport: viewport,
                            textDivs: []
                        });
                        
                        // 페이지 완료 처리
                        renderedPages.push(pageIndex);
                        renderedCount++;
                        
                        // 다음 페이지 렌더링
                        renderNextPage(pageIndex + 1);
                    });
                }).catch(function(error) {
                    console.error(`페이지 ${pageIndex} 렌더링 오류:`, error);
                    // 오류가 발생해도 다음 페이지 계속 진행
                    renderNextPage(pageIndex + 1);
                });
            }).catch(function(error) {
                console.error(`페이지 ${pageIndex} 가져오기 오류:`, error);
                // 오류가 발생해도 다음 페이지 계속 진행
                renderNextPage(pageIndex + 1);
            });
        }
        
        // 첫 페이지부터 렌더링 시작
        renderNextPage(1);
    }

    /**
     * 특정 페이지로 스크롤
     * @param {number} pageNumber - 이동할 페이지 번호
     */
    function scrollToPage(pageNumber) {
        const pageElement = document.getElementById(`page-${pageNumber}`);
        if (pageElement) {
            pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            currentPage = pageNumber;
            updatePageInfo();
            updateOutlineActiveState();
        }
    }

    /**
     * 페이지 번호 정보 업데이트
     */
    function updatePageInfo() {
        pageNum.textContent = currentPage;
    }

    /**
     * 이전 페이지로 이동
     */
    function goPrevPage() {
        if (currentPage <= 1) return;
        currentPage--;
        scrollToPage(currentPage);
    }

    /**
     * 다음 페이지로 이동
     */
    function goNextPage() {
        if (!pdfDoc || currentPage >= pdfDoc.numPages) return;
        currentPage++;
        scrollToPage(currentPage);
    }

    /**
     * 확대 기능 - 모든 페이지에 적용
     */
    function zoomInPage() {
        if (isRendering) return;
        
        scale += 0.25;
        if (scale > 3.0) scale = 3.0;
        updateZoomSelect();
        applyZoomToAllPages();
    }

    /**
     * 축소 기능 - 모든 페이지에 적용
     */
    function zoomOutPage() {
        if (isRendering) return;
        
        scale -= 0.25;
        if (scale < 0.25) scale = 0.25;
        updateZoomSelect();
        applyZoomToAllPages();
    }

    /**
     * 모든 페이지에 확대/축소 적용
     */
    function applyZoomToAllPages() {
        if (!pdfDoc) return;
        
        isRendering = true;
        
        // 현재 스크롤 위치 저장
        const scrollContainer = pdfViewer;
        const currentScrollTop = scrollContainer.scrollTop;
        const scrollRatio = currentScrollTop / scrollContainer.scrollHeight;
        
        // 로딩 화면 표시
        pdfLoading.style.display = 'flex';
        pdfLoading.innerHTML = `
            <div class="loading-spinner"></div>
            <p>확대/축소 적용 중...</p>
        `;
        
        // 컨테이너 초기화하고 모든 페이지 다시 렌더링
        pdfContainer.innerHTML = '';
        renderedPages = [];
        
        // 페이지 다시 렌더링
        renderAllPages();
        
        // 렌더링 완료 후 스크롤 위치 복원 (약간의 지연 후)
        setTimeout(() => {
            const newScrollTop = scrollContainer.scrollHeight * scrollRatio;
            scrollContainer.scrollTop = newScrollTop;
            
            isRendering = false;
        }, 100);
    }

    /**
     * 줌 선택 업데이트
     */
    function updateZoomSelect() {
        // 가장 가까운 줌 옵션 선택
        const options = Array.from(zoomSelect.options);
        let closestOption = options[0];
        let minDiff = Math.abs(parseFloat(options[0].value) - scale);
        
        for (let i = 1; i < options.length; i++) {
            const diff = Math.abs(parseFloat(options[i].value) - scale);
            if (diff < minDiff) {
                minDiff = diff;
                closestOption = options[i];
            }
        }
        
        if (minDiff < 0.1) {
            zoomSelect.value = closestOption.value;
        } else {
            // 없는 경우 커스텀 옵션 추가
            let customOption = document.getElementById('custom-zoom');
            if (!customOption) {
                customOption = document.createElement('option');
                customOption.id = 'custom-zoom';
                zoomSelect.appendChild(customOption);
            }
            customOption.value = scale.toString();
            customOption.textContent = `${Math.round(scale * 100)}%`;
            zoomSelect.value = scale.toString();
        }
    }

    /**
     * 전체화면 토글
     */
    function toggleFullScreen() {
        if (!document.fullscreenElement) {
            // 전체화면으로 전환
            if (documentContent.requestFullscreen) {
                documentContent.requestFullscreen();
            } else if (documentContent.mozRequestFullScreen) { // Firefox
                documentContent.mozRequestFullScreen();
            } else if (documentContent.webkitRequestFullscreen) { // Chrome, Safari
                documentContent.webkitRequestFullscreen();
            } else if (documentContent.msRequestFullscreen) { // IE/Edge
                documentContent.msRequestFullscreen();
            }
            fullScreenBtn.innerHTML = '<i class="fas fa-compress"></i> 창 모드';
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
            fullScreenBtn.innerHTML = '<i class="fas fa-expand"></i> 전체화면';
        }
    }

    /**
     * 문서 인쇄
     */
    function printDocument() {
        if (!pdfDoc) return;
        window.open(pdfPath, '_blank');
        setTimeout(() => {
            window.print();
        }, 1000);
    }

    /**
     * 문서 다운로드
     */
    function downloadDocument() {
        if (!pdfPath) return;
        const link = document.createElement('a');
        link.href = pdfPath;
        link.download = pdfPath.split('/').pop();
        link.target = '_blank';
        link.click();
    }

    /**
     * 사이드바 토글
     */
    function toggleSidebar() {
        documentContent.classList.toggle('sidebar-collapsed');
        
        // 토글 버튼 아이콘 변경
        const toggleIcon = toggleSidebarBtn.querySelector('i');
        if (documentContent.classList.contains('sidebar-collapsed')) {
            toggleIcon.className = 'fas fa-chevron-right';
        } else {
            toggleIcon.className = 'fas fa-chevron-left';
        }
    }

    /**
     * PDF 목차 로드 및 표시
     */
    function loadOutline() {
        if (!pdfDoc) return;
        
        // 목차 비우기
        outlineList.innerHTML = '<li class="outline-loading">목차를 불러오는 중...</li>';
        
        // 목차 데이터 가져오기
        pdfDoc.getOutline().then(function(outline) {
            pdfOutline = outline;
            
            if (!outline || outline.length === 0) {
                outlineList.innerHTML = '<li class="outline-empty">이 문서에는 목차가 없습니다.</li>';
                return;
            }
            
            // 목차 생성
            outlineList.innerHTML = '';
            renderOutlineItems(outline, outlineList, 1);
            
            // 현재 페이지에 해당하는 목차 항목 활성화
            updateOutlineActiveState();
        }).catch(function(error) {
            console.error('목차 로드 오류:', error);
            outlineList.innerHTML = '<li class="outline-error">목차를 불러오지 못했습니다.</li>';
        });
    }

    /**
     * 목차 항목 렌더링 함수
     * @param {Array} items - 목차 항목 배열
     * @param {Element} parent - 부모 요소
     * @param {number} level - 현재 깊이 수준
     */
    function renderOutlineItems(items, parent, level) {
        if (!items || !items.length) return;
        
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            
            if (!item.dest && !item.url) continue;
            
            // 목차 항목 요소 생성
            const li = document.createElement('li');
            li.className = `outline-item outline-item-level-${level}`;
            
            const a = document.createElement('a');
            a.href = '#';
            a.textContent = item.title || '무제';
            a.setAttribute('data-dest', JSON.stringify(item.dest));
            
            // 페이지 변경 이벤트 설정
            a.addEventListener('click', function(e) {
                e.preventDefault();
                
                if (item.dest) {
                    // 목적지 정보로 페이지 구하기
                    const dest = item.dest;
                    
                    if (typeof dest === 'string') {
                        pdfDoc.getDestination(dest).then(function(destArray) {
                            return pdfDoc.getPageIndex(destArray[0]);
                        }).then(function(pageIndex) {
                            currentPage = pageIndex + 1;
                            scrollToPage(currentPage);
                        });
                    } else if (Array.isArray(dest)) {
                        if (typeof dest[0] === 'object' && dest[0].num !== undefined) {
                            // 페이지 번호로 이동
                            currentPage = dest[0].num;
                            scrollToPage(currentPage);
                        } else {
                            pdfDoc.getPageIndex(dest[0]).then(function(pageIndex) {
                                currentPage = pageIndex + 1;
                                scrollToPage(currentPage);
                            });
                        }
                    }
                } else if (item.url) {
                    // 외부 URL 열기
                    window.open(item.url, '_blank');
                }
            });
            
            li.appendChild(a);
            parent.appendChild(li);
            
            // 자식 항목이 있으면 재귀적으로 처리
            if (item.items && item.items.length > 0) {
                const ul = document.createElement('ul');
                ul.className = 'outline-children';
                li.appendChild(ul);
                renderOutlineItems(item.items, ul, level + 1);
            }
        }
    }

    /**
     * 현재 페이지에 해당하는 목차 항목 활성화
     */
    function updateOutlineActiveState() {
        // 모든 목차 항목의 활성 상태 제거
        const allItems = outlineList.querySelectorAll('a');
        allItems.forEach(item => item.classList.remove('active'));
        
        if (!pdfOutline) return;
        
        // 현재 페이지에 해당하는 목차 항목 찾기 (첫 번째 일치 항목)
        let foundItem = null;
        
        function findOutlineItemForCurrentPage(items) {
            if (foundItem) return;
            
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                
                if (item.dest) {
                    // 목차 항목의 페이지 번호 확인
                    let pageRef;
                    if (typeof item.dest === 'string') {
                        // 나중에 처리
                        continue;
                    } else if (Array.isArray(item.dest)) {
                        if (typeof item.dest[0] === 'object' && item.dest[0].num !== undefined) {
                            pageRef = item.dest[0].num;
                        }
                    }
                    
                    if (pageRef === currentPage) {
                        foundItem = item;
                        break;
                    }
                }
                
                // 자식 항목 검색
                if (item.items && item.items.length > 0) {
                    findOutlineItemForCurrentPage(item.items);
                }
            }
        }
        
        findOutlineItemForCurrentPage(pdfOutline);
        
        // 찾은 항목 활성화
        if (foundItem) {
            const selector = `a[data-dest='${JSON.stringify(foundItem.dest)}']`;
            const element = outlineList.querySelector(selector);
            if (element) {
                element.classList.add('active');
                // 스크롤 위치 조정
                element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    }
    
    /**
     * 현재 보이는 페이지 감지
     */
    function detectVisiblePage() {
        const pages = document.querySelectorAll('.page');
        if (!pages.length) return;
        
        let bestVisiblePage = null;
        let maxVisibleArea = 0;
        
        pages.forEach(page => {
            const rect = page.getBoundingClientRect();
            const viewHeight = window.innerHeight;
            
            // 페이지가 화면에 보이는 영역 계산
            const visibleTop = Math.max(0, rect.top);
            const visibleBottom = Math.min(viewHeight, rect.bottom);
            const visibleHeight = Math.max(0, visibleBottom - visibleTop);
            
            if (visibleHeight > maxVisibleArea) {
                maxVisibleArea = visibleHeight;
                bestVisiblePage = page;
            }
        });
        
        if (bestVisiblePage) {
            const pageNumber = parseInt(bestVisiblePage.dataset.pageNumber);
            if (pageNumber !== currentPage) {
                currentPage = pageNumber;
                updatePageInfo();
                updateOutlineActiveState();
            }
        }
    }

    /**
     * 키보드 단축키 처리
     */
    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', function(e) {
            // 이전 페이지: 왼쪽 화살표, 페이지업
            if ((e.key === 'ArrowLeft' || e.key === 'PageUp') && !e.ctrlKey && !e.metaKey) {
                goPrevPage();
                e.preventDefault();
            }
            
            // 다음 페이지: 오른쪽 화살표, 페이지다운, 스페이스
            if ((e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') && !e.ctrlKey && !e.metaKey) {
                goNextPage();
                e.preventDefault();
            }
            
            // 첫 페이지: Home
            if (e.key === 'Home' && !e.ctrlKey && !e.metaKey) {
                currentPage = 1;
                scrollToPage(currentPage);
                e.preventDefault();
            }
            
            // 마지막 페이지: End
            if (e.key === 'End' && !e.ctrlKey && !e.metaKey) {
                if (pdfDoc) {
                    currentPage = pdfDoc.numPages;
                    scrollToPage(currentPage);
                }
                e.preventDefault();
            }
            
            // 확대: Ctrl + '+' 또는 Ctrl + '='
            if ((e.key === '+' || e.key === '=') && (e.ctrlKey || e.metaKey)) {
                zoomInPage();
                e.preventDefault();
            }
            
            // 축소: Ctrl + '-'
            if (e.key === '-' && (e.ctrlKey || e.metaKey)) {
                zoomOutPage();
                e.preventDefault();
            }
            
            // 원래 크기로: Ctrl + '0'
            if (e.key === '0' && (e.ctrlKey || e.metaKey)) {
                scale = 1.0;
                updateZoomSelect();
                applyZoomToAllPages();
                e.preventDefault();
            }
            
            // 전체화면 토글: F11 또는 F
            if (e.key === 'F11' || (e.key === 'f' && !e.ctrlKey && !e.metaKey && !e.altKey)) {
                toggleFullScreen();
                e.preventDefault();
            }
        });
    }

    /**
     * 이벤트 리스너 설정
     */
    function setupEventListeners() {
        // 이전/다음 페이지 버튼
        prevButton.addEventListener('click', goPrevPage);
        nextButton.addEventListener('click', goNextPage);
        
        // 줌 버튼 및 선택
        zoomIn.addEventListener('click', zoomInPage);
        zoomOut.addEventListener('click', zoomOutPage);
        zoomSelect.addEventListener('change', function() {
            scale = parseFloat(this.value);
            applyZoomToAllPages();
        });
        
        // 전체화면 버튼
        fullScreenBtn.addEventListener('click', toggleFullScreen);
        document.addEventListener('fullscreenchange', function() {
            if (document.fullscreenElement) {
                fullScreenBtn.innerHTML = '<i class="fas fa-compress"></i> 창 모드';
            } else {
                fullScreenBtn.innerHTML = '<i class="fas fa-expand"></i> 전체화면';
            }
        });
        
        // 인쇄 및 다운로드 버튼
        printBtn.addEventListener('click', printDocument);
        downloadBtn.addEventListener('click', downloadDocument);
        
        // 사이드바 토글 버튼
        toggleSidebarBtn.addEventListener('click', toggleSidebar);
        
        // 스크롤 이벤트 감지 (현재 페이지 번호 업데이트)
        pdfViewer.addEventListener('scroll', function() {
            if (!pdfDoc || isRendering) return;
            
            // 스로틀링 적용
            if (!pdfViewer.scrollDetectionTimeout) {
                pdfViewer.scrollDetectionTimeout = setTimeout(() => {
                    detectVisiblePage();
                    pdfViewer.scrollDetectionTimeout = null;
                }, 100);
            }
        }, { passive: true });
    }

    // 문서 로드 및 이벤트 리스너 설정
    setupEventListeners();
    setupKeyboardShortcuts();
    
    // 사이드바 처음에 접기
    documentContent.classList.add('sidebar-collapsed');
    
    // PDF 로드
    loadPDF();
});