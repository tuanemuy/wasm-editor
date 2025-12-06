import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { Editor } from "@tiptap/react";
import { useEffect, useRef } from "react";

interface UseDragHandleOptions {
  editor: Editor;
  getPos: () => number | undefined;
  node: ProseMirrorNode;
  wrapperRef: React.RefObject<HTMLDivElement | null>;
}

export const useDragHandle = ({
  editor,
  getPos,
  node,
  wrapperRef,
}: UseDragHandleOptions) => {
  const dragHandleRef = useRef<HTMLDivElement>(null);
  const cleanupListenersRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const dragHandle = dragHandleRef.current;
    const wrapper = wrapperRef.current;
    if (!dragHandle || !wrapper) return;

    let isDragging = false;
    let draggedElement: HTMLElement | null = null;
    let dropIndicator: HTMLElement | null = null;
    let offsetY = 0;
    let dropPos: number | null = null;

    const handleDragHandleTouchStart = (e: TouchEvent) => {
      e.preventDefault();

      isDragging = true;
      const touch = e.touches[0];
      const wrapperRect = wrapper.getBoundingClientRect();

      // タッチ位置とブロックの上端との差を計算
      offsetY = touch.clientY - wrapperRect.top;

      // ドラッグ中のビジュアルフィードバック用のクローンを作成
      draggedElement = wrapper.cloneNode(true) as HTMLElement;
      draggedElement.style.position = "fixed";
      draggedElement.style.left = `${wrapperRect.left}px`;
      draggedElement.style.top = `${wrapperRect.top}px`;
      draggedElement.style.width = `${wrapper.offsetWidth}px`;
      draggedElement.style.opacity = "0.5";
      draggedElement.style.pointerEvents = "none";
      draggedElement.style.zIndex = "1000";
      document.body.appendChild(draggedElement);

      // ドロップ位置インジケーターを作成
      dropIndicator = document.createElement("div");
      dropIndicator.style.position = "fixed";
      dropIndicator.style.height = "2px";
      dropIndicator.style.backgroundColor = "var(--color-primary, #3b82f6)";
      dropIndicator.style.zIndex = "999";
      dropIndicator.style.display = "none";

      // エディターの幅に合わせる
      const editorRect = editor.view.dom.getBoundingClientRect();
      dropIndicator.style.left = `${editorRect.left}px`;
      dropIndicator.style.width = `${editorRect.width}px`;

      document.body.appendChild(dropIndicator);

      // 元の要素を半透明に
      wrapper.style.opacity = "0.3";

      const handleTouchMove = (moveEvent: TouchEvent) => {
        if (!isDragging || !draggedElement || !dropIndicator) return;

        moveEvent.preventDefault();
        const moveTouch = moveEvent.touches[0];

        // クローンの位置を更新（オフセットを考慮）
        draggedElement.style.top = `${moveTouch.clientY - offsetY}px`;

        // ドロップ位置を計算
        const editorView = editor.view;
        const pos = editorView.posAtCoords({
          left: moveTouch.clientX,
          top: moveTouch.clientY,
        });

        if (pos) {
          // タッチ位置に最も近いcustomBlockの境界を見つける
          try {
            const touchY = moveTouch.clientY;
            let closestPos: number | null = null;
            let closestDistance = Number.POSITIVE_INFINITY;

            // すべてのcustomBlockを走査
            editorView.state.doc.descendants((node, nodePos) => {
              if (node.type.name === "customBlock") {
                // ブロックの前後の位置を確認
                const beforePos = nodePos;
                const afterPos = nodePos + node.nodeSize;

                // 各位置の座標を取得
                try {
                  const beforeCoords = editorView.coordsAtPos(beforePos);
                  const afterCoords = editorView.coordsAtPos(afterPos);

                  // タッチ位置との距離を計算
                  const beforeDistance = Math.abs(beforeCoords.top - touchY);
                  const afterDistance = Math.abs(afterCoords.top - touchY);

                  if (beforeDistance < closestDistance) {
                    closestDistance = beforeDistance;
                    closestPos = beforePos;
                  }

                  if (afterDistance < closestDistance) {
                    closestDistance = afterDistance;
                    closestPos = afterPos;
                  }
                } catch {
                  // 座標取得エラーは無視
                }
              }
            });

            if (closestPos !== null && closestDistance < 100) {
              // 100px以内の最も近い境界を使用
              dropPos = closestPos;
              const coords = editorView.coordsAtPos(closestPos);

              dropIndicator.style.top = `${coords.top}px`;
              dropIndicator.style.display = "block";
            } else {
              dropIndicator.style.display = "none";
              dropPos = null;
            }
          } catch {
            // エラー時は非表示
            dropIndicator.style.display = "none";
            dropPos = null;
          }
        } else {
          dropIndicator.style.display = "none";
          dropPos = null;
        }
      };

      const cleanupListeners = () => {
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
        document.removeEventListener("touchcancel", handleTouchEnd);
        cleanupListenersRef.current = null;
      };

      const handleTouchEnd = () => {
        if (!isDragging) return;

        isDragging = false;

        // クローンを削除
        if (draggedElement) {
          draggedElement.remove();
          draggedElement = null;
        }

        // ドロップインジケーターを削除
        if (dropIndicator) {
          dropIndicator.remove();
          dropIndicator = null;
        }

        // 元の要素の透明度を戻す
        wrapper.style.opacity = "1";

        // ノードを移動
        if (dropPos !== null) {
          const pos = getPos();
          if (typeof pos === "number" && pos !== dropPos) {
            const { tr } = editor.state;
            const nodeSize = node.nodeSize;

            // 現在の位置からノードを削除
            const deleted = tr.delete(pos, pos + nodeSize);

            // 新しい位置を計算（削除後のマッピング）
            const mappedPos = deleted.mapping.map(dropPos);

            // 新しい位置にノードを挿入
            deleted.insert(mappedPos, node);

            editor.view.dispatch(deleted);
          }
        }

        dropPos = null;

        // リスナーを削除
        cleanupListeners();
      };

      document.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });
      document.addEventListener("touchend", handleTouchEnd);
      document.addEventListener("touchcancel", handleTouchEnd);

      // クリーンアップ関数をrefに保存
      cleanupListenersRef.current = cleanupListeners;
    };

    dragHandle.addEventListener("touchstart", handleDragHandleTouchStart, {
      passive: false,
    });

    return () => {
      dragHandle.removeEventListener("touchstart", handleDragHandleTouchStart);

      // ドラッグ中の場合、残っているリスナーをクリーンアップ
      if (cleanupListenersRef.current) {
        cleanupListenersRef.current();
      }

      // 残っているDOM要素をクリーンアップ
      if (draggedElement) {
        draggedElement.remove();
      }
      if (dropIndicator) {
        dropIndicator.remove();
      }

      // 元の要素の透明度を戻す
      wrapper.style.opacity = "1";
    };
  }, [editor, getPos, node, wrapperRef]);

  return dragHandleRef;
};
